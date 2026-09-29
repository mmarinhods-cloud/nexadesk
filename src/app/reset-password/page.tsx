import type { Metadata } from "next";
import Link from "next/link";
import { sendPasswordReset } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Recuperar acesso" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  return <main className="auth-page"><section className="panel auth-card"><Link href="/" className="brand-word">nexadesk</Link><h1>Recuperar acesso</h1><p className="muted">Enviaremos um link de redefinição, se este e-mail tiver uma conta ativa.</p>{params.notice && <p className="form-success" role="status">Se este e-mail estiver cadastrado, o link chegará em instantes.</p>}<form action={sendPasswordReset}><label className="form-field">E-mail<input className="text-input" name="email" type="email" autoComplete="email" required/></label><SubmitButton pendingText="Enviando…">Enviar link</SubmitButton></form><Link href="/login" className="auth-back">Voltar para entrar</Link></section></main>;
}
