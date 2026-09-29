import test from "node:test";
import assert from "node:assert/strict";
import { accountEmailContent } from "../src/lib/auth/email-template.ts";

test("e-mail de confirmação inclui botão, prazo e alternativa em texto", () => {
  const link = "http://127.0.0.1:3000/verify-email?token=abc";
  const message = accountEmailContent("verify_email", link);
  assert.match(message.subject, /Confirme seu e-mail/);
  assert.match(message.html, /Confirmar e-mail/);
  assert.match(message.html, /24 horas/);
  assert.match(message.html, /lang="pt-BR"/);
  assert.ok(message.text.includes(link));
});

test("link é escapado no HTML e redefinição tem prazo curto", () => {
  const message = accountEmailContent("reset_password", "http://localhost/?a=1&b=\"teste\"");
  assert.match(message.html, /30 minutos/);
  assert.match(message.html, /&amp;b=&quot;teste&quot;/);
  assert.ok(!message.html.includes('href="http://localhost/?a=1&b="teste""'));
});
