import "server-only";
import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
export const cookieName = "minton_session";
const digest = (v: string) => createHash("sha256").update(v).digest();
export function passwordMatches(value: string) {
  return (
    !!process.env.ADMIN_PASSWORD &&
    timingSafeEqual(digest(value), digest(process.env.ADMIN_PASSWORD))
  );
}
export function makeSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${expires}.${createHmac("sha256", secret).update(expires).digest("hex")}`;
}
export async function isAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return false;
  const [expires, sig] = token.split(".");
  if (
    !expires ||
    !sig ||
    !Number.isFinite(Number(expires)) ||
    Number(expires) < Date.now()
  )
    return false;
  const expected = createHmac("sha256", secret).update(expires).digest("hex");
  return timingSafeEqual(digest(sig), digest(expected));
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}
