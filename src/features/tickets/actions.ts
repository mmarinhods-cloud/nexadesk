"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sanitizeMessageHtml } from "@/lib/safe-html";
import { getLocalActor } from "@/lib/local/session";
import { rateLimit } from "@/lib/local/rate-limit";
import { addMessage, addTicketTag, applyMacro, createTicket, getTicket, markNotificationsRead, saveView, updateTicket } from "@/lib/local/tickets";
import { getAIProvider } from "@/features/ai/provider";
import { listMessages } from "@/lib/local/tickets";

const ticketSchema = z.object({ subject: z.string().trim().min(5).max(240), description: z.string().trim().min(15).max(10000), customerId: z.string().optional(), priority: z.enum(["low", "medium", "high", "urgent"]).optional() });
const messageSchema = z.object({ ticketId: z.string().min(1), body: z.string().trim().min(1).max(20000), visibility: z.enum(["public", "internal"]) });
async function localActor() {
  return getLocalActor();
}

export async function createTicketAction(formData: FormData) {
  const actor = await localActor();
  rateLimit(`ticket:${actor.id}`, 10, 60000);
  const parsed = ticketSchema.safeParse({ subject: formData.get("subject"), description: formData.get("description"), customerId: formData.get("customerId") || undefined, priority: formData.get("priority") || undefined });
  if (!parsed.success) redirect(actor.role === "customer" ? "/portal/new-ticket?error=invalid" : "/app/tickets/new?error=invalid");
  const id = createTicket(actor, { ...parsed.data, channel: actor.role === "customer" ? "portal" : "web" });
  revalidatePath("/app"); revalidatePath("/app/tickets"); revalidatePath("/portal/tickets");
  redirect(actor.role === "customer" ? `/portal/tickets/${id}` : `/app/tickets/${id}`);
}

export async function sendMessageAction(ticketId: string, body: string, visibility: "public" | "internal") {
  const actor = await localActor();
  const parsed = messageSchema.parse({ ticketId, body, visibility });
  const cleaned = sanitizeMessageHtml(parsed.body);
  if (!cleaned.replace(/<[^>]*>/g, "").trim()) throw new Error("A mensagem precisa de texto.");
  addMessage(actor, parsed.ticketId, cleaned, parsed.visibility);
  revalidatePath(`/app/tickets/${ticketId}`); revalidatePath(`/portal/tickets/${ticketId}`); revalidatePath("/app");
  return { ok: true };
}

export async function changeTicketAction(ticketId: string, field: "status" | "priority" | "assignee_id", value: string) {
  const actor = await localActor();
  z.enum(["status", "priority", "assignee_id"]).parse(field);
  if (field === "status") z.enum(["open", "in_progress", "waiting_customer", "resolved", "closed"]).parse(value);
  if (field === "priority") z.enum(["low", "medium", "high", "urgent"]).parse(value);
  updateTicket(actor, ticketId, field, value === "unassigned" ? null : value);
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function bulkStatusAction(ids: string[], status: string) {
  const actor = await localActor();
  const valid = z.enum(["open", "in_progress", "waiting_customer", "resolved", "closed"]).parse(status);
  const validIds = z.array(z.uuid()).max(100).parse(ids);
  for (const id of validIds) updateTicket(actor, id, "status", valid);
  revalidatePath("/app", "layout");
  return { count: validIds.length };
}

export async function addTagAction(ticketId: string, tag: string) {
  const actor = await localActor();
  const valid = z.string().trim().min(2).max(30).regex(/^[a-z0-9-]+$/).parse(tag);
  addTicketTag(actor, ticketId, valid);
  revalidatePath(`/app/tickets/${ticketId}`);
}

export async function applyMacroAction(ticketId: string, macroId: string) {
  const actor = await localActor();
  const body = applyMacro(actor, ticketId, macroId);
  revalidatePath(`/app/tickets/${ticketId}`);
  return body;
}

export async function saveViewAction(formData: FormData) {
  const actor = await localActor();
  const name = z.string().trim().min(2).max(50).parse(formData.get("name"));
  const filters = z.object({
    status: z.enum(["all", "open", "in_progress", "waiting_customer", "resolved", "closed"]),
    priority: z.enum(["all", "low", "medium", "high", "urgent"]),
    assignee: z.string().max(50),
    tag: z.string().max(30),
  }).parse({ status: formData.get("status") || "all", priority: formData.get("priority") || "all", assignee: formData.get("assignee") || "all", tag: formData.get("tag") || "all" });
  saveView(actor, name, filters);
  revalidatePath("/app/tickets");
}

export async function markNotificationsAction(id?: string) {
  const actor = await localActor();
  markNotificationsRead(actor, id);
  revalidatePath("/app", "layout");
}

export async function aiAssistAction(ticketId: string, kind: "reply" | "summary" | "tags" | "concise" | "formal" | "friendly" | "clear" | "translate", text = "") {
  const actor = await localActor();
  if (actor.role === "customer") throw new Error("Ação disponível somente para agentes.");
  z.enum(["reply", "summary", "tags", "concise", "formal", "friendly", "clear", "translate"]).parse(kind);
  z.string().max(20_000).parse(text);
  rateLimit(`ai:${actor.id}`, 30, 60000);
  const ticket = getTicket(actor, ticketId);
  if (!ticket) throw new Error("Ticket não encontrado.");
  const provider = getAIProvider();
  const messages = listMessages(actor, ticketId);
  if (kind === "reply") return { content: sanitizeMessageHtml(provider.generateReply(ticket, messages)), label: "Rascunho gerado · revise antes de enviar" };
  if (kind === "summary") return { content: provider.summarizeThread(ticket, messages).join("\n"), label: "Resumo gerado" };
  if (kind === "tags") return { content: provider.suggestTags(`${ticket.subject} ${ticket.description}`).join(", "), label: "Tags sugeridas" };
  return { content: sanitizeMessageHtml(provider.rewriteText(text, kind)), label: "Texto gerado · revise antes de enviar" };
}
