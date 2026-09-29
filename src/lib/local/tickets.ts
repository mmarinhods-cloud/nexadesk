import { randomUUID } from "node:crypto";
import { getDb, transaction, type Db } from "@/lib/local/db";
import { publishLocalEvent } from "@/lib/local/realtime";
import { hasPermission } from "@/lib/auth/permissions";
import { assertStaff } from "@/lib/local/session";
import { plainRow, plainRows } from "@/lib/local/serialize";
import type { Actor, Agent, Macro, Message, Notification, Priority, SlaPolicy, Ticket, TicketEvent } from "@/lib/local/types";

const baseTicketQuery = `select t.*, c.name customer_name, c.email customer_email, co.name company_name, a.name assignee_name,
  coalesce((select group_concat(tags.name, ', ') from ticket_tags tt join tags on tags.id=tt.tag_id where tt.ticket_id=t.id),'') tags
  from tickets t join customers c on c.id=t.customer_id left join companies co on co.id=t.company_id left join agents a on a.id=t.assignee_id`;

export type TicketFilters = { q?: string; status?: string; priority?: string; assignee?: string; tag?: string; customer?: string; company?: string; sort?: string };

export function listTickets(actor: Actor, filters: TicketFilters = {}): Ticket[] {
  const where = ["t.organization_id = ?"];
  const values: (string | number | null)[] = [actor.organizationId];
  if (actor.role === "customer") { where.push("t.customer_id = ?"); values.push(actor.customerId ?? ""); }
  if (filters.q) { where.push("(lower(t.subject) like ? or cast(t.number as text) like ? or lower(c.name) like ?)"); const term = `%${filters.q.toLowerCase()}%`; values.push(term, term, term); }
  if (filters.status && filters.status !== "all") { where.push("t.status = ?"); values.push(filters.status); }
  if (filters.priority && filters.priority !== "all") { where.push("t.priority = ?"); values.push(filters.priority); }
  if (filters.assignee === "unassigned") where.push("t.assignee_id is null");
  else if (filters.assignee && filters.assignee !== "all") { where.push("t.assignee_id = ?"); values.push(filters.assignee === "me" ? actor.id : filters.assignee); }
  if (filters.tag && filters.tag !== "all") { where.push("exists (select 1 from ticket_tags tt join tags tag on tag.id=tt.tag_id where tt.ticket_id=t.id and tag.name=?)"); values.push(filters.tag); }
  if (filters.customer) { where.push("t.customer_id = ?"); values.push(filters.customer); }
  if (filters.company) { where.push("t.company_id = ?"); values.push(filters.company); }
  const sort = filters.sort === "oldest" ? "t.updated_at asc" : filters.sort === "priority" ? "case t.priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end, t.updated_at desc" : "t.updated_at desc";
  return plainRows(getDb().prepare(`${baseTicketQuery} where ${where.join(" and ")} order by ${sort} limit 200`).all(...values) as unknown as Ticket[]);
}

export function getTicket(actor: Actor, id: string): Ticket | null {
  const ticket = getDb().prepare(`${baseTicketQuery} where t.organization_id=? and t.id=?`).get(actor.organizationId, id) as Ticket | undefined;
  if (!ticket) return null;
  if (actor.role === "customer" && ticket.customer_id !== actor.customerId) return null;
  return plainRow(ticket);
}

export function listMessages(actor: Actor, ticketId: string): Message[] {
  if (!getTicket(actor, ticketId)) return [];
  const visibility = actor.role === "customer" ? "and visibility='public'" : "";
  return plainRows(getDb().prepare(`select id,ticket_id,author_id,author_name,visibility,body,created_at from messages where organization_id=? and ticket_id=? ${visibility} order by created_at,id`).all(actor.organizationId, ticketId) as unknown as Message[]);
}

export function listEvents(actor: Actor, ticketId: string): TicketEvent[] {
  assertStaff(actor);
  if (!getTicket(actor, ticketId)) return [];
  return plainRows(getDb().prepare("select id,ticket_id,kind,actor_name,old_value,new_value,created_at from events where organization_id=? and ticket_id=? order by created_at,id").all(actor.organizationId, ticketId) as unknown as TicketEvent[]);
}

export function listAgents(actor: Actor): Agent[] {
  assertStaff(actor);
  return plainRows(getDb().prepare("select * from agents where organization_id=? order by name").all(actor.organizationId) as unknown as Agent[]);
}

export function listMacros(actor: Actor): Macro[] {
  assertStaff(actor);
  return plainRows(getDb().prepare("select * from macros where organization_id=? order by command").all(actor.organizationId) as unknown as Macro[]);
}

export function listSlaPolicies(actor: Actor): SlaPolicy[] {
  assertStaff(actor);
  return plainRows(getDb().prepare("select * from sla_policies where organization_id=? order by resolution_minutes").all(actor.organizationId) as unknown as SlaPolicy[]);
}

export function listTags(actor: Actor): string[] {
  assertStaff(actor);
  const rows = getDb().prepare("select name from tags where organization_id=? order by name").all(actor.organizationId) as { name: string }[];
  return rows.map((row) => row.name);
}

function recordEvent(db: Db, actor: Actor, ticketId: string, kind: string, oldValue: string | null, newValue: string | null) {
  const now = new Date().toISOString();
  db.prepare("insert into events values (?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, ticketId, kind, actor.name, oldValue, newValue, now);
  db.prepare("insert into audit_logs values (?,?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, actor.id, "ticket", ticketId, kind, oldValue, newValue, now);
}

function notify(db: Db, actor: Actor, recipientId: string, kind: string, body: string, ticketId: string) {
  db.prepare("insert into notifications values (?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, recipientId, kind, body, ticketId, null, new Date().toISOString());
}

function addTag(db: Db, org: string, ticketId: string, tag: string) {
  let row = db.prepare("select id from tags where organization_id=? and name=?").get(org, tag) as { id: string } | undefined;
  if (!row) { row = { id: randomUUID() }; db.prepare("insert into tags values (?,?,?)").run(row.id, org, tag); }
  db.prepare("insert or ignore into ticket_tags values (?,?)").run(ticketId, row.id);
}

function runAutomations(db: Db, actor: Actor, ticketId: string, trigger: "ticket_created" | "status_changed") {
  const ticket = db.prepare("select * from tickets where id=? and organization_id=?").get(ticketId, actor.organizationId) as Record<string, string | number | null>;
  const rules = db.prepare("select * from automations where organization_id=? and enabled=1 and trigger_kind=?").all(actor.organizationId, trigger) as { id: string; condition_field: string; condition_value: string; action_kind: string; action_value: string }[];
  for (const rule of rules) {
    const matches = rule.condition_field === "subject_contains"
      ? String(ticket.subject).toLowerCase().includes(rule.condition_value.toLowerCase())
      : String(ticket[rule.condition_field]) === rule.condition_value;
    if (!matches) continue;
    if (rule.action_kind === "assign") db.prepare("update tickets set assignee_id=? where id=? and organization_id=?").run(rule.action_value, ticketId, actor.organizationId);
    if (rule.action_kind === "priority") db.prepare("update tickets set priority=? where id=? and organization_id=?").run(rule.action_value, ticketId, actor.organizationId);
    if (rule.action_kind === "tag") addTag(db, actor.organizationId, ticketId, rule.action_value);
    if (rule.action_kind === "notify") notify(db, actor, rule.action_value, "automation", `Automação executada no ticket #${ticket.number}`, ticketId);
    db.prepare("insert into automation_runs values (?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, rule.id, ticketId, `${rule.action_kind}: ${rule.action_value}`, new Date().toISOString());
    recordEvent(db, actor, ticketId, "automation_triggered", null, `${rule.action_kind}: ${rule.action_value}`);
  }
}

function detectSentiment(text: string): string {
  const normalized = text.toLowerCase();
  if (/frustrad|absurd|inaceit|urgente|angry|unacceptable/.test(normalized)) return "frustrated";
  if (/falha|erro|problema|cobrad|failed|issue/.test(normalized)) return "negative";
  if (/obrigad|ótim|thank|great/.test(normalized)) return "positive";
  return "neutral";
}

export function createTicket(actor: Actor, input: { subject: string; description: string; customerId?: string; priority?: Priority; channel?: "portal" | "web" }): string {
  const customerId = actor.role === "customer" ? actor.customerId! : input.customerId!;
  const customer = getDb().prepare("select id,company_id,name,plan from customers where id=? and organization_id=?").get(customerId, actor.organizationId) as { id: string; company_id: string | null; name: string; plan: string } | undefined;
  if (!customer) throw new Error("Cliente não encontrado neste workspace.");
  const id = transaction((db) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    if (process.env.DATABASE_URL) db.prepare("select pg_advisory_xact_lock(hashtext(?))").get(`nexadesk-ticket-number:${actor.organizationId}`);
    const number = ((db.prepare("select coalesce(max(number),0)+1 as value from tickets where organization_id=?").get(actor.organizationId) as { value: number }).value);
    const priority = actor.role === "customer" ? "medium" : input.priority ?? "medium";
    const policyId = (db.prepare("select id from sla_policies where organization_id=? order by resolution_minutes limit 1").get(actor.organizationId) as { id: string } | undefined)?.id ?? null;
    db.prepare("insert into tickets values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id, actor.organizationId, number, input.subject, input.description, "open", priority, input.channel ?? "portal", customerId, customer.company_id, null, policyId, detectSentiment(input.description), now, now, null, null);
    db.prepare("insert into messages values (?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, id, actor.id, actor.name, "public", input.description, now);
    recordEvent(db, actor, id, "ticket_created", null, "open");
    runAutomations(db, actor, id, "ticket_created");
    const recipient = (db.prepare("select id from agents where organization_id=? order by case role when 'owner' then 0 when 'admin' then 1 else 2 end,name limit 1").get(actor.organizationId) as { id: string } | undefined)?.id;
    if (recipient) notify(db, actor, recipient, "new_ticket", `Novo ticket #${number}: ${input.subject}`, id);
    return id;
  });
  publishLocalEvent(actor.organizationId, id);
  return id;
}

export function addMessage(actor: Actor, ticketId: string, body: string, visibility: "public" | "internal") {
  const ticket = getTicket(actor, ticketId);
  if (!ticket) throw new Error("Ticket não encontrado ou sem permissão.");
  if (actor.role === "customer" && visibility !== "public") throw new Error("Cliente não pode criar nota interna.");
  transaction((db) => {
    const now = new Date().toISOString();
    db.prepare("insert into messages values (?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, ticketId, actor.id, actor.name, visibility, body, now);
    db.prepare("update tickets set updated_at=?, first_response_at=case when first_response_at is null and ?='public' and ?!='customer' then ? else first_response_at end where id=? and organization_id=?").run(now, visibility, actor.role, now, ticketId, actor.organizationId);
    recordEvent(db, actor, ticketId, visibility === "internal" ? "internal_note" : "message_sent", null, visibility);
    if (visibility === "public") {
      const firstAgent = (db.prepare("select id from agents where organization_id=? order by case role when 'owner' then 0 when 'admin' then 1 else 2 end,name limit 1").get(actor.organizationId) as { id: string } | undefined)?.id;
      const recipient = actor.role === "customer" ? ticket.assignee_id ?? firstAgent : ticket.customer_id;
      if (recipient) notify(db, actor, recipient, "reply", `${actor.name} respondeu ao ticket #${ticket.number}`, ticketId);
    }
  });
  publishLocalEvent(actor.organizationId, ticketId);
}

export function updateTicket(actor: Actor, ticketId: string, field: "status" | "priority" | "assignee_id", value: string | null) {
  assertStaff(actor);
  if (field === "assignee_id" && !hasPermission(actor.role, "tickets.assign")) throw new Error("Sem permissão para atribuir tickets.");
  const ticket = getTicket(actor, ticketId);
  if (!ticket) throw new Error("Ticket não encontrado.");
  if (field === "assignee_id" && value) {
    const agent = getDb().prepare("select id from agents where id=? and organization_id=?").get(value, actor.organizationId);
    if (!agent) throw new Error("Agente inválido.");
  }
  transaction((db) => {
    const now = new Date().toISOString();
    const oldValue = ticket[field];
    db.prepare(`update tickets set ${field}=?,updated_at=?,resolved_at=case when ?='status' and ? in ('resolved','closed') then ? when ?='status' then null else resolved_at end where id=? and organization_id=?`).run(value, now, field, value, now, field, ticketId, actor.organizationId);
    recordEvent(db, actor, ticketId, `${field}_changed`, oldValue, value);
    if (field === "status") runAutomations(db, actor, ticketId, "status_changed");
    if (field === "assignee_id" && value) notify(db, actor, value, "assigned", `Ticket #${ticket.number} atribuído a você`, ticketId);
  });
  publishLocalEvent(actor.organizationId, ticketId);
}

export function applyMacro(actor: Actor, ticketId: string, macroId: string): string {
  assertStaff(actor);
  if (!getTicket(actor, ticketId)) throw new Error("Ticket não encontrado.");
  const macro = getDb().prepare("select * from macros where id=? and organization_id=?").get(macroId, actor.organizationId) as Macro | undefined;
  if (!macro) throw new Error("Macro não encontrada.");
  if (macro.status) updateTicket(actor, ticketId, "status", macro.status);
  if (macro.priority) updateTicket(actor, ticketId, "priority", macro.priority);
  if (macro.tag) { transaction((db) => addTag(db, actor.organizationId, ticketId, macro.tag!)); publishLocalEvent(actor.organizationId, ticketId); }
  return macro.body;
}

export function listNotifications(actor: Actor): Notification[] {
  return plainRows(getDb().prepare("select * from notifications where organization_id=? and recipient_id=? order by created_at desc limit 30").all(actor.organizationId, actor.id) as unknown as Notification[]);
}

export function markNotificationsRead(actor: Actor, id?: string) {
  const db = getDb();
  if (id) db.prepare("update notifications set read_at=? where id=? and organization_id=? and recipient_id=?").run(new Date().toISOString(), id, actor.organizationId, actor.id);
  else db.prepare("update notifications set read_at=? where organization_id=? and recipient_id=? and read_at is null").run(new Date().toISOString(), actor.organizationId, actor.id);
}

export function getSla(ticket: Ticket): { state: "safe" | "risk" | "breached" | "done"; label: string; minutes: number } {
  if (ticket.status === "resolved" || ticket.status === "closed") return { state: "done", label: "Concluído", minutes: 0 };
  const policy = getDb().prepare("select * from sla_policies where id=? and organization_id=?").get(ticket.sla_policy_id, ticket.organization_id) as SlaPolicy | undefined;
  if (!policy) return { state: "safe", label: "Sem política", minutes: 0 };
  const deadline = Date.parse(ticket.created_at) + (ticket.first_response_at ? policy.resolution_minutes : policy.first_response_minutes) * 60000;
  const minutes = Math.ceil((deadline - Date.now()) / 60000);
  if (minutes < 0) return { state: "breached", label: `${Math.abs(minutes)} min vencido`, minutes };
  if (minutes <= 15) return { state: "risk", label: `${minutes} min restantes`, minutes };
  if (minutes < 60) return { state: "safe", label: `${minutes} min restantes`, minutes };
  return { state: "safe", label: `${Math.ceil(minutes / 60)} h restantes`, minutes };
}

export function addTicketTag(actor: Actor, ticketId: string, tag: string) {
  assertStaff(actor);
  if (!getTicket(actor, ticketId)) throw new Error("Ticket não encontrado.");
  transaction((db) => { addTag(db, actor.organizationId, ticketId, tag); recordEvent(db, actor, ticketId, "tag_added", null, tag); });
  publishLocalEvent(actor.organizationId, ticketId);
}

export function saveView(actor: Actor, name: string, filters: TicketFilters) {
  assertStaff(actor);
  getDb().prepare("insert into saved_views values (?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, actor.id, name, JSON.stringify(filters), new Date().toISOString());
}

export function listSavedViews(actor: Actor): { id: string; name: string; filters: string }[] {
  assertStaff(actor);
  return plainRows(getDb().prepare("select id,name,filters from saved_views where organization_id=? and actor_id=? order by created_at desc").all(actor.organizationId, actor.id) as { id: string; name: string; filters: string }[]);
}
