import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getCompany, listCompanyCustomers } from "@/lib/local/customers";
import { listTickets } from "@/lib/local/tickets";
import { formatDate, StatusBadge } from "@/components/ticket-ui";

export const metadata: Metadata = { title: "Perfil da empresa" };

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getLocalActor();
  const { id } = await params;
  const company = getCompany(actor, id);
  if (!company) notFound();
  const customers = listCompanyCustomers(actor, id);
  const tickets = listTickets(actor, { company: id });

  return <>
    <Link href="/app/companies" className="back-link"><ArrowLeft size={14}/> Todas as empresas</Link>
    <div className="profile-header panel">
      <span className="profile-avatar"><Building2 size={28}/></span>
      <div><div className="eyebrow">CONTA B2B</div><h1>{company.name}</h1><div className="profile-meta"><span>{company.plan}</span><span>Status: {company.account_status}</span></div></div>
    </div>
    <div className="profile-stats">
      <div className="panel"><span className="eyebrow">CONTATOS</span><strong>{company.customer_count}</strong></div>
      <div className="panel"><span className="eyebrow">TICKETS</span><strong>{company.ticket_count}</strong></div>
      <div className="panel"><span className="eyebrow">ÚLTIMO CONTATO</span><strong>{tickets[0] ? formatDate(tickets[0].updated_at) : "—"}</strong></div>
    </div>
    <div className="section-grid">
      <section className="panel"><div className="section-head"><h2>Tickets da empresa</h2></div>{tickets.map((ticket) => <Link className="record-row" href={`/app/tickets/${ticket.id}`} key={ticket.id}><span className="muted">#{ticket.number}</span><strong>{ticket.subject}</strong><StatusBadge status={ticket.status}/></Link>)}{company.ticket_count > tickets.length && <p className="notice">Exibindo os 200 tickets mais recentes desta empresa.</p>}</section>
      <section className="panel"><div className="section-head"><h2>Contatos</h2></div>{customers.map((customer) => <Link className="record-row" href={`/app/customers/${customer.id}`} key={customer.id}><strong>{customer.name}</strong><span className="muted">{customer.email}</span></Link>)}</section>
    </div>
  </>;
}
