import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocalActor } from "@/lib/local/session";
import { saveArticleAction } from "@/features/knowledge/actions";

export const metadata: Metadata = { title: "Novo artigo" };
export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await getLocalActor();
  if (actor.role !== "owner" && actor.role !== "admin") redirect("/app/knowledge");
  const { error } = await searchParams;
  return <div style={{ maxWidth: 850 }}><div className="eyebrow">CONHECIMENTO / NOVO</div><h1 className="page-title">Criar artigo</h1><p className="muted">Escreva em Markdown. Publique quando o conteúdo estiver pronto para clientes.</p>{error && <p className="form-error">Preencha título e conteúdo.</p>}<form action={saveArticleAction} className="panel form-panel"><label className="form-field">Título<input className="text-input" name="title" minLength={5} maxLength={180} required/></label><label className="form-field">Categoria<select className="text-input" name="category" defaultValue="Getting Started"><option>Getting Started</option><option>Account</option><option>Billing</option><option>Integrations</option><option>Troubleshooting</option></select></label><label className="form-field">Conteúdo Markdown<textarea className="text-input" name="body" rows={16} minLength={20} required placeholder="# Título\n\nExplique a solução em passos claros."/></label><label className="form-field">Status<select className="text-input" name="status" defaultValue="draft"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label><div className="form-actions"><Link href="/app/knowledge" className="button-secondary">Cancelar</Link><button type="submit" className="button-primary">Salvar artigo</button></div></form></div>;
}
