import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus, Search } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { listArticles } from "@/lib/local/knowledge";

export const metadata: Metadata = { title: "Base de conhecimento" };
export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const actor = await getLocalActor();
  const { q = "", category = "all" } = await searchParams;
  const articles = listArticles(actor, q, category);
  const canEdit = actor.role === "owner" || actor.role === "admin";
  const categories = ["Getting Started", "Account", "Billing", "Integrations", "Troubleshooting"];
  return <><div className="page-heading"><div><div className="eyebrow">CONHECIMENTO</div><h1>Base de conhecimento</h1><p className="muted">Respostas que a equipe e os clientes podem encontrar.</p></div>{canEdit && <Link href="/app/knowledge/new" className="button-primary"><Plus size={16}/>Novo artigo</Link>}</div><form action="/app/knowledge" className="filter-bar panel"><Search size={18} className="muted"/><input name="q" defaultValue={q} className="text-input" placeholder="Buscar artigos" aria-label="Buscar artigos"/><select name="category" defaultValue={category} className="role-select" aria-label="Categoria"><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="submit" className="button-secondary">Buscar</button></form><div className="article-grid">{articles.map((article) => <Link href={`/app/knowledge/${article.id}`} className="panel article-card" key={article.id}><div className="eyebrow">{article.category}</div><BookOpen size={19} color="var(--primary)"/><h2>{article.title}</h2><p>{article.body.replace(/[#*`]/g, "").slice(0, 115)}…</p><div><span>{article.status === "published" ? "Publicado" : "Rascunho"}</span><span>{article.views} visualizações</span></div></Link>)}</div>{!articles.length && <div className="empty-state panel">Nenhum artigo corresponde à busca. Ajuste os termos ou crie um novo artigo.</div>}</>;
}
