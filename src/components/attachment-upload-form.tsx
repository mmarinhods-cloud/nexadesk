"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadAttachmentAction } from "@/features/attachments/actions";

export function AttachmentUploadForm({ ticketId, customer }: { ticketId: string; customer: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        const result = await uploadAttachmentAction(data);
        if (!result.ok) { setError(result.error); return; }
        setError("");
        form.reset();
        router.refresh();
      } catch { setError("Não foi possível anexar o arquivo. Tente novamente."); }
    });
  }
  return <>
    <form ref={formRef} onSubmit={upload} className={`attachment-form ${customer ? "attachment-form-customer" : "attachment-form-staff"}`}>
      <input type="hidden" name="ticketId" value={ticketId}/>
      <label className="attachment-label" htmlFor={`file-${ticketId}`}>Arquivo</label>
      <input id={`file-${ticketId}`} className="attachment-file" type="file" name="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" required/>
      {customer
        ? <input type="hidden" name="visibility" value="public"/>
        : <select name="visibility" className="role-select" aria-label="Visibilidade do anexo"><option value="public">Público para o cliente</option><option value="internal">Só equipe</option></select>}
      <button type="submit" className="button-secondary" disabled={pending}>{pending ? "Enviando…" : "Anexar arquivo"}</button>
    </form>
    {error && <p className="form-error attachment-feedback" role="alert">{error}</p>}
  </>;
}
