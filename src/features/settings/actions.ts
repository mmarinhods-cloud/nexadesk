"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocalActor, assertManager } from "@/lib/local/session";
import { getDb } from "@/lib/local/db";

async function manager() {
  const actor = await getLocalActor(); assertManager(actor); return actor;
}

export async function updateWorkspaceAction(formData: FormData) {
  const actor = await manager();
  const name = z.string().trim().min(2).max(80).parse(formData.get("name"));
  getDb().prepare("update organizations set name=? where id=?").run(name, actor.organizationId);
  revalidatePath("/app", "layout");
}

export async function updateSlaAction(formData: FormData) {
  const actor = await manager();
  const id = z.string().min(1).parse(formData.get("id"));
  const first = z.coerce.number().int().min(1).max(10080).parse(formData.get("first"));
  const resolution = z.coerce.number().int().min(1).max(43200).parse(formData.get("resolution"));
  getDb().prepare("update sla_policies set first_response_minutes=?,resolution_minutes=? where id=? and organization_id=?").run(first, resolution, id, actor.organizationId);
  revalidatePath("/app", "layout");
}

export async function createTagAction(formData: FormData) {
  const actor = await manager();
  const name = z.string().trim().min(2).max(30).regex(/^[a-z0-9-]+$/).parse(formData.get("name"));
  getDb().prepare("insert or ignore into tags values (?,?,?)").run(randomUUID(), actor.organizationId, name);
  revalidatePath("/app/settings");
}

export async function createMacroAction(formData: FormData) {
  const actor = await manager();
  const parsed = z.object({ command: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/), title: z.string().trim().min(2).max(100), body: z.string().trim().min(5).max(5000) }).parse({ command: formData.get("command"), title: formData.get("title"), body: formData.get("body") });
  getDb().prepare("insert into macros values (?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, parsed.command, parsed.title, parsed.body, null, null, null);
  revalidatePath("/app/settings");
}
