import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, MessageSquare, StickyNote, UserRound } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getTicket, getSla, listAgents, listEvents, listMacros, listMessages, listTickets } from "@/lib/local/tickets";
import { getAIProvider } from "@/features/ai/provider";
import { formatDate, PriorityBadge, RichBody, SlaBadge, StatusBadge } from "@/components/ticket-ui";
import { Composer } from "@/features/tickets/components/composer";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { PropertySelect, SuggestedTags, SummaryButton } from "@/features/tickets/components/ticket-controls";

export const metadata: Metadata = { title: "Detalhe do ticket" };
export const dynamic = "force-dynamic";
const statusOptions = [{ value: "open", label: "Aberto" }, { value: "in_progress", label: "Em andamento" }, { value: "waiting_customer", label: "Aguardando cliente" }, { value: "resolved", label: "Resolvido" }, { value: "closed", label: "Fechado" }];
const priorityOptions = [{ value: "low", label: "Baixa" }, { value: "medium", label: "Média" }, { value: "high", label: "Alta" }, { value: "urgent", label: "Urgente" }];

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getLocalActor();
  const { id } = await params;
  const ticket = getTicket(actor, id);
  if (!ticket) notFound();
  const messages = listMessages(actor, id);
  const events = listEvents(actor, id);
  const agents = listAgents(actor);
  const context = listTickets(actor).filter((item) => !["resolved", "closed"].includes(item.status)).slice(0, 12);
  const suggested = getAIProvider().suggestTags(`${ticket.subject} ${ticket.description}`).filter((tag) => !ticket.tags.split(", ").includes(tag));
  const assigneeOptions = [{ value: "unassigned", label: "Sem responsável" }, ...agents.map((agent) => ({ value: agent.id, label: agent.name }))];
  const timeline = [
    ...messages.map((message) => ({ id: message.id, date: message.created_at, kind: "message" as const, message })),
    ...events.filter((event) => event.kind !== "ticket_created" && event.kind !== "message_sent" && event.kind !== "internal_note").map((event) => ({ id: event.id, date: event.created_at, kind: "event" as const, event })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return <><div className="ticket-detail-header"><div><Link href="/app/tickets" className="back-link"><ArrowLeft size={14}/> Voltar aos tickets</Link><div className="eyebrow" style={{ marginTop: 16 }}>TICKET #{ticket.number} · {ticket.channel === "portal" ? "PORTAL" : "WEB"}</div><h1>{ticket.subject}</h1><div className="detail-badges"><StatusBadge status={ticket.status}/><PriorityBadge priority={ticket.priority}/><SlaBadge ticket={ticket}/></div></div><div className="muted" style={{ fontSize: ".78rem" }}>Atualizado {formatDate(ticket.updated_at)}</div></div><div className="ticket-layout"><aside className="ticket-context panel"><div className="section-head"><h2>Fila ativa</h2><span className="muted" style={{ fontSize: ".73rem" }}>{context.length}</span></div><div>{context.map((item) => <Link key={item.id} href={`/app/tickets/${item.id}`} className={`context-item ${item.id === id ? "active" : ""}`}><span className="muted">#{item.number}</span><strong>{item.subject}</strong><small>{item.customer_name}</small></Link>)}</div></aside><div className="ticket-conversation"><div className="conversation-top"><div><div className="eyebrow">CONVERSA</div><h2>Histórico do atendimento</h2></div><SummaryButton ticketId={id}/></div><div className="timeline">{timeline.map((item) => item.kind === "message" ? <article key={item.id} className={`timeline-message ${item.message.visibility === "internal" ? "internal" : ""}`}><div className="message-avatar">{item.message.author_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div className="message-content"><div className="message-heading"><strong>{item.message.author_name}</strong><span className={`message-kind ${item.message.visibility}`}>{item.message.visibility === "internal" ? <><StickyNote size={12}/> Nota interna</> : <><MessageSquare size={12}/> Resposta pública</>}</span><time>{formatDate(item.date)}</time></div><RichBody body={item.message.body}/></div></article> : <div key={item.id} className="timeline-event"><span className="event-dot"/>{item.event.actor_name} · {item.event.kind.replaceAll("_", " ")} {item.event.new_value ? `→ ${item.event.new_value}` : ""}<time>{formatDate(item.date)}</time></div>)}</div><Composer ticketId={id} macros={listMacros(actor)}/><AttachmentsPanel ticketId={id}/></div><aside className="ticket-properties panel"><div className="section-head"><h2>Propriedades</h2></div><div className="property-section"><PropertySelect ticketId={id} field="status" value={ticket.status} options={statusOptions} label="Status"/><PropertySelect ticketId={id} field="priority" value={ticket.priority} options={priorityOptions} label="Prioridade"/>{actor.role === "agent" ? <div className="property-field"><span>Responsável</span><strong>{agents.find((agent) => agent.id === ticket.assignee_id)?.name ?? "Sem responsável"}</strong></div> : <PropertySelect ticketId={id} field="assignee_id" value={ticket.assignee_id ?? "unassigned"} options={assigneeOptions} label="Responsável"/>}<div className="property-field"><span>SLA</span><strong className={`sla-${getSla(ticket).state}`}>{getSla(ticket).label}</strong></div><div className="property-field"><span>Sentimento · IA local</span><strong>{ticket.sentiment}</strong></div><div className="property-field"><span>Tags</span><strong>{ticket.tags || "Sem tags"}</strong></div></div><SuggestedTags ticketId={id} tags={suggested}/><div className="property-divider"/><div className="property-section"><div className="eyebrow">CLIENTE</div><Link href={`/app/customers/${ticket.customer_id}`} className="customer-mini"><span className="avatar"><UserRound size={15}/></span><strong>{ticket.customer_name}</strong></Link><div className="property-meta"><Building2 size={14}/>{ticket.company_name ?? "Sem empresa"}</div><div className="property-meta"><Mail size={14}/>{ticket.customer_email}</div></div></aside></div></>;
}
