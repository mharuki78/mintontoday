import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptOptions = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const derive = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, scryptOptions, (error, key) => error ? reject(error) : resolve(key));
});
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt:131072:8:1:${salt.toString("hex")}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  if (!/^scrypt:131072:8:1:[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded)) return false;
  const parts = encoded.split(":");
  return timingSafeEqual(await derive(password, Buffer.from(parts[4], "hex")), Buffer.from(parts[5], "hex"));
}
export function constantTimeEqual(a: string, b: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}
export const sessionMaxAge = 8 * 60 * 60;
export function signSession(version: string, secret: string, now = Date.now()) {
  if (secret.length < 32) throw new Error("Session secret is not configured");
  const payload = `${now + sessionMaxAge * 1000}.${version}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
export function validSession(token: string, version: string, secret: string, allowLegacy = false, now = Date.now()) {
  if (secret.length < 32) return false;
  const parts = token.split(".");
  const legacy = parts.length === 2 && allowLegacy;
  if (!legacy && (parts.length !== 3 || parts[1] !== version)) return false;
  const expires = Number(parts[0]);
  if (!/^\d+$/.test(parts[0]) || !Number.isSafeInteger(expires) || expires <= now || expires > now + sessionMaxAge * 1000) return false;
  const signature = parts.at(-1)!;
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  const payload = legacy ? parts[0] : `${parts[0]}.${parts[1]}`;
  return constantTimeEqual(signature, createHmac("sha256", secret).update(payload).digest("hex"));
}
