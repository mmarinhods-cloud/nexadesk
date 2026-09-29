import Link from "next/link";
import { AlertTriangle, ArrowUp, CheckCircle2, Circle, Clock3, MessageCircle, ShieldAlert } from "lucide-react";
import { sanitizeMessageHtml } from "@/lib/safe-html";
import type { Priority, Ticket, TicketStatus } from "@/lib/local/types";
import { getSla } from "@/lib/local/tickets";

export const statusLabels: Record<TicketStatus, string> = { open: "Aberto", in_progress: "Em andamento", waiting_customer: "Aguardando cliente", resolved: "Resolvido", closed: "Fechado" };
export const priorityLabels: Record<Priority, string> = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };

export function StatusBadge({ status }: { status: TicketStatus }) {
  const Icon = status === "resolved" || status === "closed" ? CheckCircle2 : status === "waiting_customer" ? Clock3 : status === "in_progress" ? MessageCircle : Circle;
  return <span className={`badge badge-${status}`}><Icon size={13} aria-hidden="true"/>{statusLabels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = priority === "urgent" ? ShieldAlert : priority === "high" ? AlertTriangle : ArrowUp;
  return <span className={`badge priority-${priority}`} title={`Prioridade ${priorityLabels[priority]}`}><Icon size={13} aria-hidden="true"/>{priorityLabels[priority]}</span>;
}

export function SlaBadge({ ticket }: { ticket: Ticket }) {
  const sla = getSla(ticket);
  return <span className={`badge sla-${sla.state}`} title={`SLA: ${sla.label}`}><Clock3 size={13} aria-hidden="true"/>{sla.label}</span>;
}

export function TicketLink({ ticket, children, portal = false }: { ticket: Ticket; children?: React.ReactNode; portal?: boolean }) {
  return <Link href={`${portal ? "/portal" : "/app"}/tickets/${ticket.id}`} className="ticket-subject-link">{children ?? ticket.subject}</Link>;
}

export function RichBody({ body }: { body: string }) {
  if (!body.trim().startsWith("<")) return <div className="rich-body" style={{ whiteSpace: "pre-wrap" }}>{body}</div>;
  const clean = sanitizeMessageHtml(body);
  return <div className="rich-body" dangerouslySetInnerHTML={{ __html: clean }}/>;
}

export function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
