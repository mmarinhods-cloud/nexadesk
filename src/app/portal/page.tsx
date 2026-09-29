import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CreditCard, Link2, LifeBuoy, UserRound } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getDb } from "@/lib/local/db";
import { listArticles } from "@/lib/local/knowledge";
import { listTickets } from "@/lib/local/tickets";
import { PortalSearch } from "@/components/portal-search";
import { StatusBadge } from "@/components/ticket-ui";

export const metadata: Metadata = { title: "Central de ajuda" };
export default async function PortalHome() {
  const actor = await getLocalActor();
  const organization = getDb().prepare("select name from organizations where id=?").get(actor.organizationId) as { name: string } | undefined;
  const articles = listArticles(actor);
  const tickets = listTickets(actor).slice(0, 3);
  const categories = [{ title: "Getting Started", icon: BookOpen }, { title: "Account", icon: UserRound }, { title: "Billing", icon: CreditCard }, { title: "Integrations", icon: Link2 }, { title: "Troubleshooting", icon: LifeBuoy }];
  return <><section className="portal-hero"><div className="eyebrow">CENTRAL DE AJUDA · {organization?.name ?? "WORKSPACE"}</div><h1>Como podemos ajudar?</h1><p>Encontre uma resposta ou acompanhe uma conversa com nosso time.</p><PortalSearch articles={articles}/></section><section className="portal-section"><div className="section-title"><h2>Explore por assunto</h2><Link href="/portal/articles">Todos os artigos <ArrowRight size={15}/></Link></div><div className="portal-categories">{categories.map(({ title, icon: Icon }) => <Link href={`/portal/articles?category=${encodeURIComponent(title)}`} className="panel" key={title}><Icon size={21}/><strong>{title}</strong><ArrowRight size={15}/></Link>)}</div></section><section className="portal-section"><div className="section-title"><h2>Artigos populares</h2><Link href="/portal/articles">Ver base completa <ArrowRight size={15}/></Link></div><div className="portal-articles">{articles.slice(0, 4).map((article) => <Link href={`/portal/articles/${article.slug}`} key={article.id} className="panel"><span className="eyebrow">{article.category}</span><strong>{article.title}</strong><span className="muted">{Math.max(1, Math.ceil(article.body.split(/\s+/).length / 200))} min de leitura</span></Link>)}</div></section><section className="portal-section"><div className="section-title"><h2>Suas solicitações recentes</h2><Link href="/portal/tickets">Ver todas <ArrowRight size={15}/></Link></div><div className="panel">{tickets.map((ticket) => <Link href={`/portal/tickets/${ticket.id}`} className="portal-request-row" key={ticket.id}><strong>#{ticket.number} · {ticket.subject}</strong><StatusBadge status={ticket.status}/></Link>)}{!tickets.length && <div className="empty-state">Você ainda não abriu uma solicitação. Nossa equipe estará aqui quando precisar.</div>}</div></section></>;
}
