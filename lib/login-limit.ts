import "server-only";
import { sql } from "drizzle-orm";
import { loginLimits } from "@/db/schema";
import { getDatabase } from "./database";
const attempts: number[] = [];
export async function allowLoginAttempt() {
  const db = getDatabase();
  const now = Date.now();
  if (!db) {
    while (attempts.length && attempts[0] < now - 60_000) attempts.shift();
    if (attempts.length >= 10) return false;
    attempts.push(now);
    return true;
  }
  const windowStart = Math.floor(now / 60_000) * 60_000;
  const [row] = await db
    .insert(loginLimits)
    .values({ key: "owner", windowStart, attempts: 1 })
    .onConflictDoUpdate({
      target: loginLimits.key,
      set: {
        windowStart,
        attempts: sql`case when ${loginLimits.windowStart} = ${windowStart} then ${loginLimits.attempts} + 1 else 1 end`,
      },
    })
    .returning({ attempts: loginLimits.attempts });
  return row.attempts <= 10;
}
