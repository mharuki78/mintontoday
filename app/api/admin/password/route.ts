import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieName, getAuthState, hasAdminSession, makeSession, passwordMatches, sameOrigin, sessionCookieOptions } from "@/lib/auth";
import { allowLoginAttempt } from "@/lib/login-limit";
import { hashPassword } from "@/lib/admin-crypto";
import { replaceAdminCredential } from "@/lib/admin-credentials";
import { passwordChangeSchema } from "@/lib/password-policy";

export const runtime = "nodejs";
const failure = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure("잘못된 요청입니다.", 403);
  if (!(await cookies()).has(cookieName)) return failure("로그인이 필요합니다.", 401);
  if (Number(request.headers.get("content-length") || 0) > 4096) return failure("요청이 너무 큽니다.", 413);
  let input;
  try {
    // Bound chunked requests as well as requests with a Content-Length header.
    const reader = request.body?.getReader();
    if (!reader) return failure("입력 내용을 확인해 주세요.", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return failure("요청이 너무 큽니다.", 413); }
      chunks.push(value);
    }
    input = passwordChangeSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch {
    return failure("입력 내용을 확인해 주세요.", 400);
  }
  if (!input.success) return failure(input.error.issues[0].message, 400);
  try {
    const state = await getAuthState();
    if (!(await hasAdminSession(state))) return failure("로그인이 만료되었습니다. 다시 로그인해 주세요.", 401);
    if (!(await allowLoginAttempt())) return failure("비밀번호 확인 시도가 많습니다. 1분 후 다시 시도해 주세요.", 429);
    if (!(await passwordMatches(input.data.currentPassword, state.credential))) return failure("현재 비밀번호를 확인해 주세요.", 400);
    const next = { passwordHash: await hashPassword(input.data.newPassword), version: randomUUID(), updatedAt: Date.now() };
    // Sign before the write so missing session configuration cannot strand the owner.
    const token = makeSession(next.version);
    if (!(await replaceAdminCredential(state.credential?.version ?? null, next)))
      return failure("다른 창에서 비밀번호가 변경되었습니다. 다시 로그인해 주세요.", 409);
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(cookieName, token, sessionCookieOptions);
    return response;
  } catch {
    return failure("변경을 완료하지 못했습니다. 새 비밀번호로 다시 로그인해 확인한 뒤 시도해 주세요.", 503);
  }
}
