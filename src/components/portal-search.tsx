"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";

export type ArticleResult = { id: string; title: string; category: string; slug: string; body: string };

export function matchArticles(articles: ArticleResult[], query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  if (!terms.length) return [];
  return articles.map((article) => ({ article, score: terms.reduce((count, term) => count + (article.title.toLowerCase().includes(term) ? 3 : 0) + (article.body.toLowerCase().includes(term) ? 1 : 0), 0) })).filter((result) => result.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map((result) => result.article);
}

export function PortalSearch({ articles, large = false }: { articles: ArticleResult[]; large?: boolean }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); input.current?.focus(); } }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  const results = matchArticles(articles, query);
  return <div className={`portal-search ${large ? "large" : ""}`}><div className="portal-search-field"><Search size={19}/><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque uma resposta, artigo ou tema" aria-label="Buscar artigos"/><kbd>Ctrl/⌘ K</kbd></div>{query && <div className="portal-search-results panel">{results.length ? results.map((article) => <Link key={article.id} href={`/portal/articles/${article.slug}`}><span><strong>{article.title}</strong><small>{article.category} · {Math.max(1, Math.ceil(article.body.split(/\s+/).length / 200))} min de leitura</small></span><ArrowUpRight size={16}/></Link>) : <p>Nenhum artigo relacionado. Você pode abrir uma solicitação.</p>}</div>}</div>;
}

export function ArticleDeflection({ articles, query }: { articles: ArticleResult[]; query: string }) {
  const results = matchArticles(articles, query);
  if (!results.length) return null;
  return <div className="deflection panel"><strong>Talvez estes artigos resolvam seu problema</strong>{results.map((article) => <Link target="_blank" rel="noreferrer" key={article.id} href={`/portal/articles/${article.slug}`}>{article.title}<ArrowUpRight size={14}/></Link>)}</div>;
}
