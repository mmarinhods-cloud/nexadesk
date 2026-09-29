import type { Metadata } from "next";
import Link from "next/link";
import { confirmEmail, resendVerification } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string; notice?: string }> }) {
  const params = await searchParams;
  return <main className="auth-page"><section className="panel auth-card"><Link href="/" className="brand-word">nexadesk</Link><h1>Confirme seu e-mail</h1>{params.error && <p className="form-error" role="alert">Link inválido ou expirado. Solicite um novo abaixo.</p>}{params.notice && <p className="form-success" role="status">Se a conta aguarda confirmação, enviaremos um novo link.</p>}{params.token ? <form action={confirmEmail}><input type="hidden" name="token" value={params.token}/><p className="muted">O link confirma que este endereço pertence a você e ativa sua conta. Ele expira em 24 horas.</p><SubmitButton pendingText="Confirmando…">Confirmar e-mail</SubmitButton></form> : <form action={resendVerification}><label className="form-field">E-mail<input className="text-input" name="email" type="email" autoComplete="email" required/></label><SubmitButton pendingText="Enviando…">Reenviar confirmação</SubmitButton></form>}<Link href="/login" className="auth-back">Voltar para entrar</Link></section></main>;
}
