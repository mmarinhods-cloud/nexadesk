"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocalActor } from "@/lib/local/session";
import { createAutomation, toggleAutomation } from "@/lib/local/automations";

const schema = z.object({ name: z.string().trim().min(4).max(100), trigger: z.enum(["ticket_created", "status_changed"]), field: z.enum(["priority", "status", "subject_contains"]), value: z.string().trim().min(1).max(100), action: z.enum(["assign", "priority", "tag", "notify"]), actionValue: z.string().trim().min(1).max(100) });

export async function createAutomationAction(formData: FormData) {
  const actor = await getLocalActor();
  const parsed = schema.parse({ name: formData.get("name"), trigger: formData.get("trigger"), field: formData.get("field"), value: formData.get("value"), action: formData.get("action"), actionValue: formData.get("actionValue") });
  createAutomation(actor, parsed);
  revalidatePath("/app/automations");
}

export async function toggleAutomationAction(id: string) {
  toggleAutomation(await getLocalActor(), id);
  revalidatePath("/app/automations");
}
