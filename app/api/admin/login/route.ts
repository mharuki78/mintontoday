import { NextResponse } from "next/server";
import {
  cookieName,
  makeSession,
  passwordMatches,
  sameOrigin,
} from "@/lib/auth";
const attempts: number[] = [];
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 403 });
  if (
    !process.env.ADMIN_PASSWORD ||
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32
  )
    return NextResponse.json(
      { error: "서버의 관리자 비밀번호와 세션 키를 먼저 설정해 주세요." },
      { status: 503 },
    );
  const now = Date.now();
  while (attempts.length && attempts[0] < now - 60_000) attempts.shift();
  if (attempts.length >= 10)
    return NextResponse.json(
      { error: "로그인 시도가 많습니다. 1분 후 다시 시도해 주세요." },
      { status: 429 },
    );
  attempts.push(now);
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096)
      return NextResponse.json(
        { error: "요청이 너무 큽니다." },
        { status: 413 },
      );
    const body = await request.json();
    if (
      typeof body.password !== "string" ||
      body.password.length > 256 ||
      !passwordMatches(body.password)
    )
      return NextResponse.json(
        { error: "비밀번호를 확인해 주세요." },
        { status: 401 },
      );
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName, makeSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "로그인 요청을 처리할 수 없습니다." },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, "", { maxAge: 0, path: "/" });
  return res;
}
