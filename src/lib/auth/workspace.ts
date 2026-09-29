import { cache } from "react";
import { redirect } from "next/navigation";
import { hasPermission, type MemberRole } from "@/lib/auth/permissions";
import { getLocalActor } from "@/lib/local/session";
import { getDb } from "@/lib/local/db";

export type Role = MemberRole;
export type Workspace = { id: string; name: string; slug: string; role: Role; userName: string };

export const getWorkspace = cache(async (): Promise<Workspace> => {
  const actor = await getLocalActor();
  if (actor.role === "customer") redirect("/portal");
  const organization = getDb().prepare("select name,slug from organizations where id=?").get(actor.organizationId) as { name: string; slug: string } | undefined;
  return { id: actor.organizationId, name: organization?.name ?? "Workspace", slug: organization?.slug ?? "", role: actor.role, userName: actor.name };
});

export function canManageSettings(role: Role) {
  return hasPermission(role, "workspace.manage");
}
