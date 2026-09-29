"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocalActor } from "@/lib/local/session";
import { createArticle, updateArticle, voteArticle } from "@/lib/local/knowledge";

const schema = z.object({ title: z.string().trim().min(5).max(180), category: z.string().trim().min(2).max(80), body: z.string().trim().min(20).max(30000), status: z.enum(["draft", "published"]) });

export async function saveArticleAction(formData: FormData) {
  const actor = await getLocalActor();
  const parsed = schema.safeParse({ title: formData.get("title"), category: formData.get("category"), body: formData.get("body"), status: formData.get("status") });
  const id = String(formData.get("id") || "");
  if (!parsed.success) redirect(id ? `/app/knowledge/${id}?error=invalid` : "/app/knowledge/new?error=invalid");
  if (id) updateArticle(actor, id, parsed.data);
  else createArticle(actor, parsed.data);
  revalidatePath("/app/knowledge"); revalidatePath("/portal/articles");
  redirect("/app/knowledge");
}

export async function voteArticleAction(id: string) {
  voteArticle(await getLocalActor(), id);
  revalidatePath(`/portal/articles/${id}`);
}
