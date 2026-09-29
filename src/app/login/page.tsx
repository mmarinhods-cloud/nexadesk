import type { Metadata } from "next";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { login } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const params = await searchParams;
  return <main className="auth-page"><section className="panel auth-card"><Link href="/" className="auth-brand"><span className="brand-mark"><Layers3 size={17}/></span><span className="brand-word">nexadesk</span></Link><h1>Boas-vindas de volta.</h1><p className="muted">Acesse sua conta para acompanhar o atendimento.</p>{params.error && <p className="form-error" role="alert">{params.error === "inactive" ? "Confirme seu e-mail antes de entrar. Você pode solicitar outro link abaixo." : params.error === "rate" ? "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." : "E-mail ou senha inválidos."}</p>}{params.notice && <p className="form-success" role="status">{params.notice === "verified" ? "E-mail confirmado. Você já pode entrar." : "Senha atualizada. Entre com a nova senha."}</p>}<form action={login}><label className="form-field">E-mail<input className="text-input" name="email" type="email" autoComplete="email" required/></label><div className="form-field"><label htmlFor="login-password">Senha</label><PasswordInput id="login-password" autoComplete="current-password"/></div><SubmitButton pendingText="Entrando…">Entrar</SubmitButton></form>{params.error === "inactive" && <Link href="/verify-email" className="auth-back">Reenviar confirmação</Link>}<div className="auth-links"><Link href="/reset-password">Esqueceu a senha?</Link><Link href="/register">Criar conta</Link></div></section></main>;
}
