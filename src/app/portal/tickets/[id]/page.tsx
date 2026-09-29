import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getTicket, listMessages } from "@/lib/local/tickets";
import { formatDate, RichBody, StatusBadge } from "@/components/ticket-ui";
import { PortalReply } from "@/components/portal-reply";
import { AttachmentsPanel } from "@/components/attachments-panel";

export const metadata: Metadata = { title: "Minha solicitação" };
export default async function PortalTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getLocalActor();
  const { id } = await params;
  const ticket = getTicket(actor, id);
  if (!ticket) notFound();
  const messages = listMessages(actor, id);
  return <div className="portal-ticket-detail"><Link href="/portal/tickets" className="back-link"><ArrowLeft size={14}/> Minhas solicitações</Link><div className="eyebrow" style={{ marginTop: 27 }}>SOLICITAÇÃO #{ticket.number}</div><h1>{ticket.subject}</h1><div className="detail-badges"><StatusBadge status={ticket.status}/><span className="muted">Aberta em {formatDate(ticket.created_at)}</span></div><div className="portal-conversation">{messages.map((message) => <div key={message.id} className={`portal-message ${message.author_id === actor.customerId ? "own" : ""}`}><div className="message-heading"><strong>{message.author_name}</strong><time>{formatDate(message.created_at)}</time></div><RichBody body={message.body}/></div>)}</div><PortalReply ticketId={id} resolved={ticket.status === "resolved" || ticket.status === "closed"}/><AttachmentsPanel ticketId={id}/></div>;
}
