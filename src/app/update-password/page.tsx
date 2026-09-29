import type { Metadata } from "next";
import Link from "next/link";
import { updatePassword } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";

export const metadata: Metadata = { title: "Definir nova senha" };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const params = await searchParams;
  return <main className="auth-page"><section className="panel auth-card"><Link href="/" className="brand-word">nexadesk</Link><h1>Definir nova senha</h1>{params.error && <p className="form-error" role="alert">{params.error === "weak" ? "Use uma senha com 8 a 128 caracteres." : "Link inválido ou expirado. Solicite outro."}</p>}{params.token ? <form action={updatePassword}><input type="hidden" name="token" value={params.token}/><div className="form-field"><label htmlFor="new-password">Nova senha</label><PasswordInput id="new-password" autoComplete="new-password" minLength={8} maxLength={128}/></div><SubmitButton pendingText="Salvando…">Salvar nova senha</SubmitButton></form> : <Link href="/reset-password" className="button-primary auth-submit">Solicitar novo link</Link>}</section></main>;
}
