"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocalActor } from "@/lib/local/session";
import { getDb, transaction } from "@/lib/local/db";
import { validName } from "@/lib/auth/validation";
import { rateLimit } from "@/lib/local/rate-limit";

export async function updateProfileAction(formData: FormData) {
  const actor = await getLocalActor();
  const name = validName(formData.get("name"));
  if (!name) redirect("/account?error=name");
  transaction((db) => {
    const now = new Date().toISOString();
    db.prepare("update accounts set name=?,updated_at=? where id=? and organization_id=?").run(name, now, actor.id, actor.organizationId);
    if (actor.role === "customer") db.prepare("update customers set name=? where id=? and organization_id=?").run(name, actor.id, actor.organizationId);
    else db.prepare("update agents set name=? where id=? and organization_id=?").run(name, actor.id, actor.organizationId);
    db.prepare("insert into audit_logs values (?,?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, actor.id, "account", actor.id, "profile_updated", actor.name, name, now);
  });
  revalidatePath("/account");
  redirect("/account?notice=saved");
}

export async function requestPrivacyAction(formData: FormData) {
  const actor = await getLocalActor();
  rateLimit(`privacy:${actor.id}`, 3, 24 * 60 * 60 * 1000);
  if (formData.get("kind") !== "deletion") redirect("/account?error=request");
  getDb().prepare("insert into privacy_requests values (?,?,?,?,?)").run(randomUUID(), actor.id, "deletion", "pending", new Date().toISOString());
  revalidatePath("/account");
  redirect("/account?notice=requested");
}
