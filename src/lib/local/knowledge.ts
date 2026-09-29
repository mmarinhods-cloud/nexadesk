import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/local/db";
import { assertManager } from "@/lib/local/session";
import { plainRow, plainRows } from "@/lib/local/serialize";
import type { Actor, Article } from "@/lib/local/types";

export function listArticles(actor: Actor, query = "", category = "all"): Article[] {
  const clauses = ["organization_id=?", "(lower(title) like ? or lower(body) like ?)"];
  const values = [actor.organizationId, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`];
  if (actor.role === "customer") clauses.push("status='published'");
  if (category !== "all") { clauses.push("category=?"); values.push(category); }
  return plainRows(getDb().prepare(`select * from articles where ${clauses.join(" and ")} order by views desc,title`).all(...values) as unknown as Article[]);
}

export function getArticle(actor: Actor, idOrSlug: string): Article | null {
  const article = getDb().prepare("select * from articles where organization_id=? and (id=? or slug=?)").get(actor.organizationId, idOrSlug, idOrSlug) as Article | undefined;
  if (!article || (actor.role === "customer" && article.status !== "published")) return null;
  return plainRow(article);
}

export function createArticle(actor: Actor, input: { title: string; category: string; body: string; status: "draft" | "published" }): string {
  assertManager(actor);
  const db = getDb();
  const id = randomUUID();
  const base = input.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "artigo";
  const slug = `${base}-${id.slice(0, 6)}`;
  const now = new Date().toISOString();
  db.prepare("insert into articles values (?,?,?,?,?,?,?,?,?,?,?,?)").run(id, actor.organizationId, input.category, input.title, slug, input.body, input.status, actor.name, 0, 0, now, now);
  db.prepare("insert into audit_logs values (?,?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, actor.id, "article", id, "article_created", null, input.status, now);
  return id;
}

export function updateArticle(actor: Actor, id: string, input: { title: string; category: string; body: string; status: "draft" | "published" }) {
  assertManager(actor);
  const db = getDb();
  const old = getArticle(actor, id);
  if (!old) throw new Error("Artigo não encontrado.");
  db.prepare("update articles set title=?,category=?,body=?,status=?,updated_at=? where id=? and organization_id=?").run(input.title, input.category, input.body, input.status, new Date().toISOString(), id, actor.organizationId);
  db.prepare("insert into audit_logs values (?,?,?,?,?,?,?,?,?)").run(randomUUID(), actor.organizationId, actor.id, "article", id, "article_updated", old.status, input.status, new Date().toISOString());
}

export function voteArticle(actor: Actor, id: string) {
  const article = getArticle(actor, id);
  if (!article) throw new Error("Artigo não encontrado.");
  getDb().prepare("update articles set helpful_votes=helpful_votes+1 where id=? and organization_id=?").run(id, actor.organizationId);
}
