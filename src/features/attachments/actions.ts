"use server";

import { revalidatePath } from "next/cache";
import { getLocalActor } from "@/lib/local/session";
import { saveAttachment } from "@/lib/local/attachments";
import { rateLimit } from "@/lib/local/rate-limit";

export async function uploadAttachmentAction(formData: FormData) {
  const actor = await getLocalActor();
  try {
    rateLimit(`attachment:${actor.id}`, 10, 60_000);
    const ticketId = String(formData.get("ticketId") || "");
    const visibility = formData.get("visibility") === "internal" ? "internal" : "public";
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Selecione um arquivo." };
    await saveAttachment(actor, ticketId, file, visibility);
    revalidatePath(`/app/tickets/${ticketId}`); revalidatePath(`/portal/tickets/${ticketId}`);
    return { ok: true, error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known = ["Limite temporário atingido.", "Ticket não encontrado.", "Cliente não pode anexar", "Arquivo inválido.", "O conteúdo do arquivo", "Nome de arquivo inválido."];
    return { ok: false, error: known.some((prefix) => message.startsWith(prefix)) ? message : "Não foi possível anexar o arquivo. Tente novamente." };
  }
}
