import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Turns a supervisor's raw field notes into structured consulting records
 * (observations, recommendations, action items, a progress note) using the
 * Lovable AI Gateway. Nothing is written to the database here — the supervisor
 * reviews and edits the draft before saving, so the model never invents a
 * record silently.
 */

const OBSERVATION_STATUSES = [
  "Observation",
  "Safety Concern",
  "Recommendation",
  "Action Required",
  "Pending Approval",
  "Needs Verification",
] as const;

const ACTION_STATUSES = [
  "Not Started",
  "In Progress",
  "Waiting",
  "Action Required",
  "Pending Approval",
  "Pending Materials",
  "Pending Client Action",
  "Ready for Implementation",
  "Implementation Started",
  "Needs Verification",
] as const;

const REC_STATUSES = [
  "Identified",
  "Recommended",
  "Ready for Implementation",
  "Implementation Started",
  "Pending Materials",
  "Pending Client Action",
  "Pending Approval",
  "Needs Verification",
] as const;

const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "observations", "recommendations", "actionItems", "progressNote"],
  properties: {
    summary: { type: "string", description: "Two or three sentence field summary." },
    progressNote: { type: "string", description: "A chronological progress note in plain professional prose." },
    observations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "status", "location", "detail"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: OBSERVATION_STATUSES as unknown as string[] },
          location: { type: ["string", "null"] },
          detail: { type: "string" },
        },
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "status", "priority", "problem", "solution", "expectedImpact"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: REC_STATUSES as unknown as string[] },
          priority: { type: "string", enum: PRIORITIES as unknown as string[] },
          problem: { type: "string" },
          solution: { type: "string" },
          expectedImpact: { type: ["string", "null"] },
        },
      },
    },
    actionItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "status", "priority", "owner", "description"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ACTION_STATUSES as unknown as string[] },
          priority: { type: "string", enum: PRIORITIES as unknown as string[] },
          owner: { type: ["string", "null"] },
          description: { type: "string" },
        },
      },
    },
  },
} as const;

const SYSTEM = [
  "You structure security and parking consulting field notes for Kairos Security.",
  "Rules you must never break:",
  "- Use only facts present in the notes. Never invent names, times, counts, capacities, approvals, prices or results.",
  "- If a detail is unclear or unconfirmed, write NEEDS VERIFICATION in that field instead of guessing.",
  "- Never mark anything Completed, Approved or Implemented unless the notes say it actually happened.",
  "- A proposed fix is a recommendation, not a completed improvement.",
  "- Keep the supervisor's own wording and terminology where possible; write in professional third person.",
  "- Produce only records the notes support. An empty list is correct when the notes contain none.",
].join("\n");

export type FieldNoteDraft = {
  summary: string;
  progressNote: string;
  observations: { title: string; status: string; location: string | null; detail: string }[];
  recommendations: {
    title: string;
    status: string;
    priority: string;
    problem: string;
    solution: string;
    expectedImpact: string | null;
  }[];
  actionItems: {
    title: string;
    status: string;
    priority: string;
    owner: string | null;
    description: string;
  }[];
};

export const structureFieldNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { notes: string; client?: string; day?: string; location?: string }) => {
    const notes = String(data?.notes ?? "").trim();
    if (notes.length < 15) throw new Error("Add a few more details before structuring the notes.");
    if (notes.length > 20000) throw new Error("Those notes are too long — split them into two entries.");
    return { notes, client: data?.client ?? "", day: data?.day ?? "", location: data?.location ?? "" };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this app yet.");

    const prompt = [
      data.client ? `Client: ${data.client}` : "",
      data.day ? `Date of the field work: ${data.day}` : "",
      data.location ? `Location: ${data.location}` : "",
      "",
      "Field notes from the operations supervisor:",
      data.notes,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: prompt,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        text: {
          format: {
            type: "json_schema",
            name: "field_notes",
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("The AI service is busy right now — try again in a moment.");
      if (res.status === 402) throw new Error("This workspace is out of AI credits. Add credits and try again.");
      if (res.status === 403) throw new Error("AI access is blocked for this workspace right now.");
      throw new Error(`The AI service could not process those notes. ${body.slice(0, 200)}`);
    }

    // Reasoning models stream; accumulate the text deltas and parse at the end.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && typeof evt.response?.output_text === "string" && !text) {
            text = evt.response.output_text;
          }
        } catch {
          /* ignore keep-alive and partial frames */
        }
      }
    }

    let parsed: FieldNoteDraft;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      throw new Error("The AI reply could not be read. Try again, or shorten the notes.");
    }

    return {
      summary: String(parsed.summary ?? ""),
      progressNote: String(parsed.progressNote ?? ""),
      observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    } satisfies FieldNoteDraft;
  });
