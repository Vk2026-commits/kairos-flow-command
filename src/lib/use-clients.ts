import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyClients, setActiveClient } from "./orgs.functions";
import type { ClientSummary, MemberRole } from "./org-constants";

export const CLIENTS_QUERY_KEY = ["kairos", "clients"] as const;

export type ClientsState = {
  clients: ClientSummary[];
  activeOrgId: string;
  memberRole: MemberRole;
  isSuperAdmin: boolean;
  isKairos: boolean;
};

/**
 * The signed-in person's client list and the client they are working in.
 * The server decides the active client, so this never leaks another client.
 */
export function useClients() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async () => (await listMyClients({ data: {} })) as ClientsState,
    staleTime: 60_000,
    retry: false,
  });

  const switching = useMutation({
    mutationFn: async (orgId: string) => setActiveClient({ data: { orgId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });

  const state = query.data ?? null;
  const active = state ? state.clients.find((c) => c.id === state.activeOrgId) ?? null : null;

  return {
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    clients: state?.clients ?? [],
    activeClient: active,
    activeOrgId: state?.activeOrgId ?? null,
    memberRole: state?.memberRole ?? null,
    isSuperAdmin: Boolean(state?.isSuperAdmin),
    isKairos: Boolean(state?.isKairos),
    switchClient: (orgId: string) => switching.mutateAsync(orgId),
    switchingTo: switching.isPending ? switching.variables : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
  };
}
