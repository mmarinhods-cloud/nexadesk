import "server-only";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/local";
import type { Actor } from "@/lib/local/types";

export async function getOptionalActor(): Promise<Actor | null> {
  const session = await readSession();
  if (!session) return null;
  const account = session.account;
  return { id: account.id, name: account.name, role: account.role, organizationId: account.organization_id, customerId: account.role === "customer" ? account.id : undefined };
}

export async function getLocalActor(): Promise<Actor> {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");
  return actor;
}

export function assertStaff(actor: Actor): void {
  if (actor.role === "customer") throw new Error("Acesso restrito à equipe de suporte.");
}

export function assertManager(actor: Actor): void {
  if (actor.role !== "owner" && actor.role !== "admin") throw new Error("Apenas administradores podem executar esta ação.");
}
