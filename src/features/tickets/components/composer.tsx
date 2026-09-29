"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Code2, Italic, Link2, List, ListOrdered, Send, Sparkles } from "lucide-react";
import { aiAssistAction, applyMacroAction, sendMessageAction } from "@/features/tickets/actions";
import type { Macro } from "@/lib/local/types";

export function Composer({ ticketId, macros }: { ticketId: string; macros: Macro[] }) {
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Placeholder.configure({ placeholder: "Escreva sua resposta… Use / para escolher uma macro." })],
    content: "", immediatelyRender: false,
    onUpdate: ({ editor: current }) => setContent(current.getHTML()),
  });
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.target as HTMLElement)?.closest("input,textarea,[contenteditable=true],select")) return;
      if (event.key.toLowerCase() === "r") { setVisibility("public"); editor?.commands.focus(); }
      if (event.key.toLowerCase() === "n") { setVisibility("internal"); editor?.commands.focus(); }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [editor]);
  const slash = content.match(/<p>\/([a-z-]*)<\/p>$/)?.[1];
  const macroMatches = slash !== undefined ? macros.filter((macro) => macro.command.includes(slash)).slice(0, 6) : [];

  function insertLink() {
    const url = window.prompt("URL do link (https://)");
    if (url && /^https?:\/\//.test(url)) editor?.chain().focus().setLink({ href: url }).run();
  }
  function insertMacro(id: string) {
    startTransition(async () => {
      try {
        const body = await applyMacroAction(ticketId, id);
        const safeBody = body.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").split(/\r?\n/).map((line) => `<p>${line || "<br>"}</p>`).join("");
        editor?.commands.setContent(safeBody);
        setNotice("Macro aplicada · revise antes de enviar"); setError(""); router.refresh();
      }
      catch { setError("Não foi possível aplicar a macro."); }
    });
  }
  function assist(kind: "reply" | "concise" | "formal" | "friendly" | "clear" | "translate") {
    startTransition(async () => {
      try { const result = await aiAssistAction(ticketId, kind, content); editor?.commands.setContent(result.content); setNotice(result.label); setError(""); }
      catch { setError("Não foi possível gerar o rascunho."); }
    });
  }
  function send() {
    startTransition(async () => {
      try { await sendMessageAction(ticketId, content, visibility); editor?.commands.clearContent(); setContent(""); setNotice(""); setError(""); router.refresh(); }
      catch { setError("Não foi possível enviar. Revise o texto e tente novamente."); }
    });
  }
  return <section className={`composer panel ${visibility === "internal" ? "composer-internal" : ""}`} aria-label="Escrever mensagem"><div className="composer-mode"><button className={visibility === "public" ? "active" : ""} type="button" onClick={() => setVisibility("public")}>Responder ao cliente <kbd>R</kbd></button><button className={visibility === "internal" ? "active" : ""} type="button" onClick={() => setVisibility("internal")}>Nota interna <kbd>N</kbd></button></div><div className="editor-toolbar"><button type="button" aria-label="Negrito" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={16}/></button><button type="button" aria-label="Itálico" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={16}/></button><button type="button" aria-label="Lista" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16}/></button><button type="button" aria-label="Lista numerada" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={16}/></button><button type="button" aria-label="Bloco de código" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Code2 size={16}/></button><button type="button" aria-label="Link" onClick={insertLink}><Link2 size={16}/></button></div><EditorContent editor={editor} className="editor-content"/>{macroMatches.length > 0 && <div className="macro-menu" role="listbox" aria-label="Macros">{macroMatches.map((macro) => <button type="button" role="option" aria-selected="false" key={macro.id} onClick={() => insertMacro(macro.id)}>/{macro.command}<small>{macro.title}</small></button>)}</div>}{notice && <p className="ai-notice" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="composer-footer"><div className="composer-tools"><select aria-label="Inserir macro" defaultValue="" onChange={(event) => { if (event.target.value) insertMacro(event.target.value); event.target.value = ""; }}><option value="">/ Macros</option>{macros.map((macro) => <option key={macro.id} value={macro.id}>/{macro.command}</option>)}</select><button type="button" onClick={() => assist("reply")} disabled={pending}><Sparkles size={14}/>Gerar resposta</button><select aria-label="Ferramentas de escrita" defaultValue="" onChange={(event) => { if (event.target.value) assist(event.target.value as "concise" | "formal" | "friendly" | "clear" | "translate"); event.target.value = ""; }}><option value="">Ajustar texto…</option><option value="concise">Mais conciso</option><option value="formal">Mais formal</option><option value="friendly">Mais amigável</option><option value="clear">Mais claro</option><option value="translate">Traduzir (revisar)</option></select></div><button type="button" className="button-primary" disabled={pending || !editor?.getText().trim()} onClick={send}><Send size={15}/>{pending ? "Salvando…" : visibility === "internal" ? "Adicionar nota" : "Enviar resposta"}</button></div></section>;
}
