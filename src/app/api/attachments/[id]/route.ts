import { NextResponse } from "next/server";
import { getOptionalActor } from "@/lib/local/session";
import { loadAttachment } from "@/lib/local/attachments";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getOptionalActor();
  if (!actor) return new NextResponse("Não autorizado", { status: 401 });
  const result = await loadAttachment(actor, id);
  if (!result) return new NextResponse("Não encontrado", { status: 404 });
  return new NextResponse(new Uint8Array(result.bytes), { headers: { "content-type": result.attachment.mime_type, "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.attachment.file_name)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
