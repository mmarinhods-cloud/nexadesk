import type { Metadata } from "next";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { register } from "@/app/actions";
import { firstAccount } from "@/lib/auth/local";
import { emailConfigured } from "@/lib/auth/mail";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";

export const metadata: Metadata = { title: "Criar conta" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const params = await searchParams;
  const initial = firstAccount();
  const mailReady = emailConfigured();
  const privacyReady = Boolean(process.env.PRIVACY_CONTROLLER_NAME && process.env.PRIVACY_CONTACT_EMAIL);
  return <main className="auth-page"><section className="panel auth-card auth-card-wide"><Link href="/" className="auth-brand"><span className="brand-mark"><Layers3 size={17}/></span><span className="brand-word">nexadesk</span></Link><h1>{initial ? "Criar o primeiro workspace" : "Criar conta de cliente"}</h1><p className="muted">{initial ? "A primeira conta será proprietária do workspace." : "Use o código do workspace fornecido pela equipe de suporte."}</p>{!mailReady && <p className="form-error" role="alert">O envio de e-mails ainda não está configurado. Defina EMAIL_USER e EMAIL_USER_TOKEN em .env.local para habilitar o cadastro.</p>}{!privacyReady && <p className="form-error" role="alert">Identifique o responsável pelos dados. Defina PRIVACY_CONTROLLER_NAME e PRIVACY_CONTACT_EMAIL em .env.local.</p>}{params.error && <p className="form-error" role="alert">{params.error === "rate" ? "Muitas tentativas. Aguarde antes de tentar novamente." : params.error.startsWith("mail") ? "Não foi possível enviar a confirmação. Confira a configuração SMTP e tente novamente." : params.error === "workspace" ? "Código do workspace inválido ou e-mail já cadastrado." : "Confira os campos e aceite a ciência do aviso de privacidade."}</p>}{params.notice && <p className="form-success" role="status">Se o cadastro puder prosseguir, você receberá um link de confirmação por e-mail.</p>}<form action={register}><label className="form-field">Nome completo<input className="text-input" name="name" autoComplete="name" minLength={2} maxLength={80} required/></label><label className="form-field">E-mail<input className="text-input" name="email" type="email" autoComplete="email" required/></label><div className="form-field"><label htmlFor="register-password">Senha</label><PasswordInput id="register-password" autoComplete="new-password" minLength={8} maxLength={128}/></div><p className="auth-help">Use pelo menos 8 caracteres e uma senha exclusiva.</p>{initial ? <label className="form-field">Nome do workspace<input className="text-input" name="workspaceName" minLength={2} maxLength={80} required/></label> : <label className="form-field">Código do workspace<input className="text-input" name="workspaceCode" minLength={3} maxLength={50} required/></label>}<label className="auth-check"><input type="checkbox" name="privacyAck" value="yes" required/><span>Li o <Link href="/privacy" target="_blank">aviso de privacidade</Link> e entendo como meus dados serão usados para criar e operar a conta.</span></label><SubmitButton pendingText="Criando conta…" disabled={!mailReady || !privacyReady}>Criar conta e confirmar e-mail</SubmitButton></form><div className="auth-links"><Link href="/login">Já tenho conta</Link><Link href="/verify-email">Reenviar confirmação</Link></div></section></main>;
}
