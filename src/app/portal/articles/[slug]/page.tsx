import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ThumbsUp } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { getArticle } from "@/lib/local/knowledge";
import { ArticleBody } from "@/components/article-body";
import { voteArticleAction } from "@/features/knowledge/actions";

export const metadata: Metadata = { title: "Artigo de ajuda" };
export default async function PortalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const actor = await getLocalActor();
  const { slug } = await params;
  const article = getArticle(actor, slug);
  if (!article) notFound();
  return <div className="portal-reading"><Link href="/portal/articles" className="back-link"><ArrowLeft size={14}/> Voltar aos artigos</Link><div className="eyebrow" style={{ marginTop: 28 }}>{article.category} · {Math.max(1, Math.ceil(article.body.split(/\s+/).length / 200))} MIN DE LEITURA</div><h1>{article.title}</h1><p className="muted">Por {article.author} · Atualizado em {new Date(article.updated_at).toLocaleDateString("pt-BR")}</p><article className="panel article-reading"><ArticleBody body={article.body}/></article><div className="article-helpful"><span>Este artigo foi útil?</span><form action={voteArticleAction.bind(null, article.id)}><button type="submit" className="button-secondary"><ThumbsUp size={15}/>Sim, ajudou</button></form><small className="muted">{article.helpful_votes} pessoas acharam útil</small></div></div>;
}
