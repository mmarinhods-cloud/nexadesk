import type { Metadata } from "next";
import Link from "next/link";
import { Plus, SlidersHorizontal } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getSla, listAgents, listSavedViews, listTags, listTickets, type TicketFilters } from "@/lib/local/tickets";
import { TicketTable } from "@/features/tickets/components/ticket-table";
import { saveViewAction } from "@/features/tickets/actions";

export const metadata: Metadata = { title: "Tickets" };
export const dynamic = "force-dynamic";

export default async function TicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const actor = await getLocalActor();
  const params = await searchParams;
  const filters: TicketFilters = { q: params.q, status: params.status, priority: params.priority, assignee: params.assignee, tag: params.tag, sort: params.sort };
  const tickets = listTickets(actor, filters);
  const agents = listAgents(actor);
  const tags = listTags(actor);
  const views = listSavedViews(actor);
  const slaLabels = Object.fromEntries(tickets.map((ticket) => [ticket.id, getSla(ticket)]));
  return <><div className="page-heading"><div><div className="eyebrow">OPERAÇÃO / TICKETS</div><h1>Todos os tickets</h1><p className="muted">Encontre, priorize e acompanhe cada solicitação.</p></div><Link className="button-primary" href="/app/tickets/new"><Plus size={16}/>Novo ticket</Link></div>
    <div className="saved-views"><Link href="/app/tickets" className="view-chip">Todos</Link><Link href="/app/tickets?assignee=me&status=open" className="view-chip">Meus abertos</Link><Link href="/app/tickets?priority=urgent" className="view-chip">Urgentes</Link><Link href="/app/tickets?assignee=unassigned" className="view-chip">Sem responsável</Link>{views.map((view) => { const saved = JSON.parse(view.filters) as TicketFilters; return <Link key={view.id} href={`/app/tickets?${new URLSearchParams(Object.entries(saved).filter((entry): entry is [string,string] => Boolean(entry[1])))}`} className="view-chip">{view.name}</Link>; })}</div>
    <form className="filter-bar panel" action="/app/tickets" method="get"><label><span className="sr-only">Buscar tickets</span><input className="text-input" name="q" defaultValue={filters.q} placeholder="Buscar por assunto, ID ou cliente"/></label><select className="role-select" name="status" defaultValue={filters.status || "all"} aria-label="Filtrar status"><option value="all">Todos os status</option><option value="open">Aberto</option><option value="in_progress">Em andamento</option><option value="waiting_customer">Aguardando cliente</option><option value="resolved">Resolvido</option><option value="closed">Fechado</option></select><select className="role-select" name="priority" defaultValue={filters.priority || "all"} aria-label="Filtrar prioridade"><option value="all">Todas as prioridades</option><option value="urgent">Urgente</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select><select className="role-select" name="assignee" defaultValue={filters.assignee || "all"} aria-label="Filtrar responsável"><option value="all">Qualquer responsável</option><option value="me">Atribuídos a mim</option><option value="unassigned">Sem responsável</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><select className="role-select" name="tag" defaultValue={filters.tag || "all"} aria-label="Filtrar tag"><option value="all">Todas as tags</option>{tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select><select className="role-select" name="sort" defaultValue={filters.sort || "newest"} aria-label="Ordenar"><option value="newest">Recentes</option><option value="oldest">Antigos</option><option value="priority">Prioridade</option></select><button className="button-secondary" type="submit"><SlidersHorizontal size={15}/>Aplicar</button></form>
    <form action={saveViewAction} className="save-view-row"><input type="hidden" name="status" value={filters.status || "all"}/><input type="hidden" name="priority" value={filters.priority || "all"}/><input type="hidden" name="assignee" value={filters.assignee || "all"}/><input type="hidden" name="tag" value={filters.tag || "all"}/><input className="text-input" name="name" placeholder="Nome da visualização" aria-label="Nome da visualização salva" minLength={2} maxLength={50} required/><button className="text-button" type="submit">Salvar filtros</button></form>
    <section className="panel"><TicketTable tickets={tickets} slaLabels={slaLabels}/></section>
  </>;
}
