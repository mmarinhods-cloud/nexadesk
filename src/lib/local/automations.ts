import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/local/db";
import { assertManager, assertStaff } from "@/lib/local/session";
import { plainRows } from "@/lib/local/serialize";
import type { Actor, Automation } from "@/lib/local/types";

export function listAutomations(actor: Actor): Automation[] {
  assertStaff(actor);
  return plainRows(getDb().prepare("select a.*,(select count(*) from automation_runs r where r.automation_id=a.id) run_count from automations a where a.organization_id=? order by a.created_at").all(actor.organizationId) as unknown as Automation[]);
}

export function listAutomationRuns(actor: Actor): { id: string; automation_name: string; ticket_id: string; details: string; created_at: string }[] {
  assertStaff(actor);
  return plainRows(getDb().prepare("select r.id,a.name automation_name,r.ticket_id,r.details,r.created_at from automation_runs r join automations a on a.id=r.automation_id where r.organization_id=? order by r.created_at desc limit 30").all(actor.organizationId) as { id: string; automation_name: string; ticket_id: string; details: string; created_at: string }[]);
}

export function createAutomation(actor: Actor, input: { name: string; trigger: string; field: string; value: string; action: string; actionValue: string }) {
  assertManager(actor);
  if (input.action === "assign" || input.action === "notify") {
    const recipient = getDb().prepare("select id from agents where id=? and organization_id=?").get(input.actionValue, actor.organizationId);
    if (!recipient) throw new Error("Agente de destino inválido.");
  }
  if (input.action === "priority" && !["low", "medium", "high", "urgent"].includes(input.actionValue)) throw new Error("Prioridade inválida.");
  if (input.action === "tag" && !/^[a-z0-9-]{2,30}$/.test(input.actionValue)) throw new Error("Tag inválida.");
  getDb().prepare("insert into automations values (?,?,?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, input.name, input.trigger, input.field, input.value, input.action, input.actionValue, 1, new Date().toISOString());
}

export function toggleAutomation(actor: Actor, id: string) {
  assertManager(actor);
  getDb().prepare("update automations set enabled=1-enabled where id=? and organization_id=?").run(id, actor.organizationId);
}
