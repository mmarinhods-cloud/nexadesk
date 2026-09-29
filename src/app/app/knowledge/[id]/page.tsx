import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, ThumbsUp } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getArticle } from "@/lib/local/knowledge";
import { ArticleBody } from "@/components/article-body";
import { saveArticleAction } from "@/features/knowledge/actions";

export const metadata: Metadata = { title: "Artigo" };
export default async function ArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; error?: string }> }) {
  const actor = await getLocalActor();
  const { id } = await params;
  const article = getArticle(actor, id);
  if (!article) notFound();
  const query = await searchParams;
  const canEdit = actor.role === "owner" || actor.role === "admin";
  return <div style={{ maxWidth: 900 }}><Link href="/app/knowledge" className="back-link"><ArrowLeft size={14}/> Voltar aos artigos</Link><div className="eyebrow" style={{ marginTop: 26 }}>{article.category} · {article.status === "published" ? "PUBLICADO" : "RASCUNHO"}</div><h1 className="page-title">{article.title}</h1><div className="article-meta">Por {article.author} <span><Eye size={14}/>{article.views} leituras</span><span><ThumbsUp size={14}/>{article.helpful_votes} úteis</span></div>{canEdit && <Link href={`/app/knowledge/${id}?edit=1`} className="button-secondary" style={{ margin: "18px 0" }}>Editar artigo</Link>}{canEdit && query.edit === "1" ? <form action={saveArticleAction} className="panel form-panel"><input type="hidden" name="id" value={id}/>{query.error && <p className="form-error">Verifique o conteúdo.</p>}<label className="form-field">Título<input className="text-input" name="title" defaultValue={article.title} required minLength={5}/></label><label className="form-field">Categoria<select name="category" className="text-input" defaultValue={article.category}><option>Getting Started</option><option>Account</option><option>Billing</option><option>Integrations</option><option>Troubleshooting</option></select></label><label className="form-field">Conteúdo Markdown<textarea name="body" className="text-input" rows={18} defaultValue={article.body} required minLength={20}/></label><label className="form-field">Status<select name="status" className="text-input" defaultValue={article.status}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label><div className="form-actions"><Link href={`/app/knowledge/${id}`} className="button-secondary">Cancelar</Link><button className="button-primary" type="submit">Salvar alterações</button></div></form> : <article className="panel article-reading"><ArticleBody body={article.body}/></article>}</div>;
}
