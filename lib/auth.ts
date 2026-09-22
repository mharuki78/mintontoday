import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminCredential, type AdminCredential } from "./admin-credentials";
import { constantTimeEqual, signSession, validSession, verifyPassword, sessionMaxAge } from "./admin-crypto";
export const cookieName = "minton_session";
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: sessionMaxAge,
};
export async function getAuthState() {
  const credential = await getAdminCredential();
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || (!credential && !process.env.ADMIN_PASSWORD))
    throw new Error("Admin authentication is not configured");
  // Keep the bootstrap password out of cookies, including dictionary-testable hashes.
  const version = credential?.version || createHmac("sha256", secret).update(`bootstrap:${process.env.ADMIN_PASSWORD}`).digest("hex");
  return { credential, version };
}
export async function passwordMatches(value: string, credential: AdminCredential | null) {
  if (credential) return verifyPassword(value, credential.passwordHash);
  return !!process.env.ADMIN_PASSWORD && constantTimeEqual(value, process.env.ADMIN_PASSWORD);
}
export function makeSession(version: string) {
  return signSession(version, process.env.SESSION_SECRET || "");
}
export async function hasAdminSession(state: Awaited<ReturnType<typeof getAuthState>>) {
  const token = (await cookies()).get(cookieName)?.value;
  return !!token && validSession(token, state.version, process.env.SESSION_SECRET || "", state.credential === null);
}
export async function isAdmin() {
  if (!(await cookies()).has(cookieName)) return false;
  try {
    return await hasAdminSession(await getAuthState());
  } catch {
    return false;
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}
