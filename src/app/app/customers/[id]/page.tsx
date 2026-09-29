import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Star } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getCustomer } from "@/lib/local/customers";
import { listTickets } from "@/lib/local/tickets";
import { formatDate, StatusBadge } from "@/components/ticket-ui";

export const metadata: Metadata = { title: "Perfil do cliente" };
export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getLocalActor();
  const { id } = await params;
  const customer = getCustomer(actor, id);
  if (!customer) notFound();
  const tickets = listTickets(actor, { customer: id });
  return <><Link href="/app/customers" className="back-link"><ArrowLeft size={14}/> Todos os clientes</Link><div className="profile-header panel"><span className="profile-avatar">{customer.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><div className="eyebrow">PERFIL DO CLIENTE</div><h1>{customer.name}</h1><div className="profile-meta"><span><Mail size={15}/>{customer.email}</span><span><Building2 size={15}/>{customer.company_name ?? "Sem empresa"}</span><span><Star size={15}/>{customer.satisfaction === null ? "Sem avaliações" : `${customer.satisfaction.toFixed(1)} de 5 em avaliações`}</span></div></div></div><div className="profile-stats"><div className="panel"><span className="eyebrow">PLANO</span><strong>{customer.plan}</strong></div><div className="panel"><span className="eyebrow">TICKETS</span><strong>{customer.ticket_count}</strong></div><div className="panel"><span className="eyebrow">ÚLTIMO CONTATO</span><strong>{tickets[0] ? formatDate(tickets[0].updated_at) : "—"}</strong></div></div><section className="panel"><div className="section-head"><h2>Histórico de solicitações</h2><span className="muted">{customer.ticket_count} tickets</span></div>{tickets.map((ticket) => <Link href={`/app/tickets/${ticket.id}`} className="record-row" key={ticket.id}><span className="muted">#{ticket.number}</span><strong>{ticket.subject}</strong><StatusBadge status={ticket.status}/><span className="muted">{formatDate(ticket.updated_at)}</span></Link>)}{customer.ticket_count > tickets.length && <p className="notice">Exibindo os 200 tickets mais recentes deste cliente.</p>}</section></>;
}
