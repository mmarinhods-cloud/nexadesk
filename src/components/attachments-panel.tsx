import Link from "next/link";
import { Paperclip } from "lucide-react";
import { getLocalActor } from "@/lib/local/session";
import { listAttachments } from "@/lib/local/attachments";
import { AttachmentUploadForm } from "@/components/attachment-upload-form";

export async function AttachmentsPanel({ ticketId }: { ticketId: string }) {
  const actor = await getLocalActor();
  const attachments = listAttachments(actor, ticketId);
  return (
    <section className="panel attachments-panel">
      <div className="section-head"><h2>Anexos</h2><span className="muted">{attachments.length}</span></div>
      <div className="attachment-list">
        {attachments.map((file) => (
          <Link key={file.id} className="attachment-row" href={`/api/attachments/${file.id}`}>
            <Paperclip size={15} aria-hidden="true"/>
            <strong>{file.file_name}</strong>
            <span className="muted">{Math.ceil(file.size_bytes / 1024)} KB · {file.visibility === "internal" ? "interno" : "público"}</span>
          </Link>
        ))}
        {!attachments.length && <p className="attachment-empty">Nenhum arquivo anexado.</p>}
      </div>
      <AttachmentUploadForm ticketId={ticketId} customer={actor.role === "customer"}/>
      <p className="attachment-hint">PNG, JPEG, WebP, PDF ou TXT · até 10 MB</p>
    </section>
  );
}
