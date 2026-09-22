import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { hashPassword, verifyPassword, signSession, validSession, sessionMaxAge } from "../lib/admin-crypto.ts";
import { passwordChangeSchema } from "../lib/password-policy.ts";

test("password change accepts memorable phrases but validates both entries", () => {
  const input = { currentPassword: "old-test-password", newPassword: "우리동네배드민턴", confirmPassword: "우리동네배드민턴" };
  assert.equal(passwordChangeSchema.safeParse(input).success, true);
  for (const next of ["short", "        ", input.currentPassword, "x".repeat(257)])
    assert.equal(passwordChangeSchema.safeParse({ ...input, newPassword: next, confirmPassword: next }).success, false);
  assert.equal(passwordChangeSchema.safeParse({ ...input, confirmPassword: "different" }).success, false);
});

test("salted password hashes verify correctly and reject corrupt records", async () => {
  const value = randomUUID();
  const first = await hashPassword(value);
  const second = await hashPassword(value);
  assert.notEqual(first, second);
  assert.ok(!first.includes(value));
  assert.equal(await verifyPassword(value, first), true);
  assert.equal(await verifyPassword("wrong", first), false);
  assert.equal(await verifyPassword(value, "scrypt:999999999:8:1:bad:bad"), false);
});

test("password rotation invalidates old sessions and blocks signature/expiry tampering", () => {
  const secret = randomUUID();
  const now = Date.now();
  const firstVersion = randomUUID();
  const token = signSession(firstVersion, secret, now);
  assert.equal(validSession(token, firstVersion, secret, false, now + 1), true);
  assert.equal(validSession(token, randomUUID(), secret, false, now + 1), false);
  assert.equal(validSession(`${token}.extra`, firstVersion, secret, false, now), false);
  assert.equal(validSession(token, firstVersion, randomUUID(), false, now), false);
  assert.equal(validSession(token, firstVersion, secret, false, now + sessionMaxAge * 1000), false);
  const expires = String(now + 10000);
  const legacy = `${expires}.${createHmac("sha256", secret).update(expires).digest("hex")}`;
  assert.equal(validSession(legacy, firstVersion, secret, true, now), true);
  assert.equal(validSession(legacy, firstVersion, secret, false, now), false);
});
