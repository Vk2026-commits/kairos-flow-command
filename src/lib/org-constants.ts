// Shared client (organization) vocabulary. Safe to import from browser code.

/** Wheeler Avenue Baptist Church — the first client, created during migration. */
export const WHEELER_ORG_ID = "11111111-1111-4111-8111-111111111111";
export const LIGHTHOUSE_ORG_ID = "22222222-2222-4222-8222-222222222222";

export const CLIENT_TYPES = [
  "Church / Ministry",
  "Corporate",
  "School / University",
  "Government",
  "Residential Community",
  "Event Venue",
  "Healthcare",
  "Nonprofit",
  "Other",
] as const;

export const ACCOUNT_STATUSES = ["Setup", "Active", "Paused", "Completed", "Archived"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export type MemberRole =
  | "kairos_super_admin"
  | "kairos_consultant"
  | "client_admin"
  | "client_leadership"
  | "client_viewer"
  | "field_user";

export const MEMBER_ROLES: MemberRole[] = [
  "kairos_super_admin",
  "kairos_consultant",
  "client_admin",
  "client_leadership",
  "client_viewer",
  "field_user",
];

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  kairos_super_admin: "Kairos Super Admin",
  kairos_consultant: "Kairos Consultant",
  client_admin: "Client Admin",
  client_leadership: "Client Leadership / Executive",
  client_viewer: "Client Viewer",
  field_user: "Field / Security User",
};

/** Roles that belong to Kairos Security rather than to the client. */
export const KAIROS_ROLES: MemberRole[] = ["kairos_super_admin", "kairos_consultant"];

export const MODULES = [
  { key: "consulting", label: "Consulting Progress" },
  { key: "parking", label: "Parking Management" },
  { key: "traffic", label: "Traffic Management" },
  { key: "lots", label: "Lots" },
  { key: "maps", label: "Maps" },
  { key: "ingressEgress", label: "Ingress / Egress" },
  { key: "vip", label: "VIP & Special Guests" },
  { key: "assessments", label: "Security Assessments" },
  { key: "siteVisits", label: "Site Visits" },
  { key: "actionItems", label: "Action Items" },
  { key: "recommendations", label: "Recommendations" },
  { key: "reporting", label: "Executive Reporting" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const ALL_MODULES_ON: Record<string, boolean> = Object.fromEntries(
  MODULES.map((m) => [m.key, true]),
);

export type ClientSummary = {
  id: string;
  name: string;
  clientType: string;
  projectName: string | null;
  accountStatus: string;
  logoUrl: string | null;
  modules: Record<string, boolean>;
  primaryContact: string | null;
  contactTitle: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  internalNotes: string | null;
};

export function isModuleEnabled(client: ClientSummary | null, key: ModuleKey): boolean {
  if (!client) return true;
  const value = client.modules?.[key];
  return value === undefined ? true : Boolean(value);
}
