import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { listTickets } from "@/lib/local/tickets";
import { StatusBadge } from "@/components/ticket-ui";

export const metadata: Metadata = { title: "Minhas solicitações" };
export default async function PortalTicketsPage() {
  const tickets = listTickets(await getLocalActor());
  return <><div className="page-heading"><div><div className="eyebrow">MINHA CONTA</div><h1>Minhas solicitações</h1><p className="muted">Acompanhe conversas e responda quando precisarmos de você.</p></div><Link href="/portal/new-ticket" className="button-primary"><Plus size={16}/>Abrir solicitação</Link></div><div className="panel">{tickets.map((ticket) => <Link href={`/portal/tickets/${ticket.id}`} className="portal-request-row" key={ticket.id}><div><span className="muted">#{ticket.number} · {new Date(ticket.created_at).toLocaleDateString("pt-BR")}</span><strong style={{ display: "block", marginTop: 5 }}>{ticket.subject}</strong></div><StatusBadge status={ticket.status}/><small className="muted">Atualizado {new Date(ticket.updated_at).toLocaleDateString("pt-BR")}</small></Link>)}{!tickets.length && <div className="empty-state"><strong>Você ainda não abriu solicitações</strong><p>Quando precisar de ajuda, nossa equipe acompanhará o pedido por aqui.</p><Link href="/portal/new-ticket" className="button-primary">Abrir solicitação</Link></div>}</div></>;
}
