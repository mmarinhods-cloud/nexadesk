import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission } from "../src/lib/auth/permissions.ts";

test("a customer cannot manage a workspace or read staff tickets", () => {
  assert.equal(hasPermission("customer", "workspace.manage"), false);
  assert.equal(hasPermission("customer", "tickets.read"), false);
  assert.equal(hasPermission("customer", "portal.read"), true);
});

test("staff capabilities follow the role hierarchy", () => {
  assert.equal(hasPermission("agent", "tickets.reply"), true);
  assert.equal(hasPermission("agent", "tickets.assign"), false);
  assert.equal(hasPermission("supervisor", "tickets.assign"), true);
  assert.equal(hasPermission("admin", "members.manage"), true);
});
