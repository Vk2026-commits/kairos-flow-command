import type { StaffRole } from "./staff.functions";

/** Effective consulting permissions only; never grants platform admin rights. */
export function consultingRole(role: StaffRole, memberRole: string): StaffRole {
  return memberRole === "client_admin" ? "admin" : role;
}