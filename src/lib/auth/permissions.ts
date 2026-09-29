export type MemberRole = "owner" | "admin" | "supervisor" | "agent" | "customer";
export type Permission = "workspace.manage" | "members.manage" | "sla.manage" | "automations.manage" | "tickets.read" | "tickets.reply" | "tickets.assign" | "analytics.read" | "knowledge.manage" | "portal.read";

const grants: Record<MemberRole, readonly Permission[]> = {
  owner: ["workspace.manage", "members.manage", "sla.manage", "automations.manage", "tickets.read", "tickets.reply", "tickets.assign", "analytics.read", "knowledge.manage", "portal.read"],
  admin: ["workspace.manage", "members.manage", "sla.manage", "automations.manage", "tickets.read", "tickets.reply", "tickets.assign", "analytics.read", "knowledge.manage", "portal.read"],
  supervisor: ["tickets.read", "tickets.reply", "tickets.assign", "analytics.read", "portal.read"],
  agent: ["tickets.read", "tickets.reply", "portal.read"],
  customer: ["portal.read"],
};

export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return grants[role].includes(permission);
}
