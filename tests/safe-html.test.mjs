import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeMessageHtml } from "../src/lib/safe-html.ts";

test("mensagens removem scripts e protocolos perigosos", () => {
  const html = sanitizeMessageHtml('<p>Olá<script>alert(1)</script><a href="javascript:alert(1)" target="_blank">abrir</a></p>');
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});
