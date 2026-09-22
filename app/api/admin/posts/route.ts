import { NextResponse } from "next/server";
import { isAdmin, sameOrigin } from "@/lib/auth";
import { articleSchema } from "@/lib/content";
import { saveArticle } from "@/lib/store";
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  if (Number(request.headers.get("content-length") || 0) > 300000)
    return NextResponse.json(
      { error: "글의 크기가 너무 큽니다." },
      { status: 413 },
    );
  try {
    const parsed = articleSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            parsed.error.issues.map(i => i.message).join(" "),
        },
        { status: 400 },
      );
    // A manual save transfers editorial ownership away from the daily updater.
    await saveArticle({ ...parsed.data, managedBy: undefined, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Article save failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      {
        error:
          "저장하지 못했습니다. 서버 저장 공간을 확인하고 다시 시도해 주세요.",
      },
      { status: 500 },
    );
  }
}
