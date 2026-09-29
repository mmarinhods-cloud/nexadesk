import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { listArticles } from "@/lib/local/knowledge";
import { PortalSearch } from "@/components/portal-search";

export const metadata: Metadata = { title: "Artigos de ajuda" };
export default async function PortalArticlesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const actor = await getLocalActor();
  const { category = "all" } = await searchParams;
  const articles = listArticles(actor, "", category);
  const all = listArticles(actor);
  return <><div className="eyebrow">CENTRAL DE AJUDA / ARTIGOS</div><h1 className="page-title">Encontre uma resposta</h1><p className="muted">Guias práticos para resolver dúvidas frequentes.</p><PortalSearch articles={all} large/><div className="saved-views" style={{ marginTop: 30 }}><Link href="/portal/articles" className="view-chip">Todos</Link>{["Getting Started", "Account", "Billing", "Integrations", "Troubleshooting"].map((item) => <Link href={`/portal/articles?category=${encodeURIComponent(item)}`} className={`view-chip ${category === item ? "selected" : ""}`} key={item}>{item}</Link>)}</div><div className="portal-article-list">{articles.map((article) => <Link href={`/portal/articles/${article.slug}`} className="panel" key={article.id}><BookOpen size={20} color="var(--primary)"/><div><span className="eyebrow">{article.category}</span><h2>{article.title}</h2><p>{article.body.replace(/[#*`]/g, "").slice(0, 145)}…</p></div><ArrowRight size={18} className="muted"/></Link>)}</div>{!articles.length && <div className="empty-state panel">Nenhum artigo nessa categoria.</div>}</>;
}
