"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocalActor } from "@/lib/local/session";
import { getDb } from "@/lib/local/db";
import { getTicket } from "@/lib/local/tickets";

export async function submitFeedbackAction(ticketId: string, rating: number, comment: string) {
  const actor = await getLocalActor();
  const ticket = getTicket(actor, ticketId);
  if (actor.role !== "customer" || !ticket || !["resolved", "closed"].includes(ticket.status)) throw new Error("Acesso negado.");
  const validRating = z.number().int().min(1).max(5).parse(rating);
  const validComment = z.string().max(1000).parse(comment);
  getDb().prepare("insert into feedback values (?,?,?,?,?,?,?) on conflict(ticket_id) do update set rating=excluded.rating,comment=excluded.comment").run(randomUUID(), actor.organizationId, ticketId, actor.customerId!, validRating, validComment, new Date().toISOString());
  revalidatePath(`/portal/tickets/${ticketId}`);
}
