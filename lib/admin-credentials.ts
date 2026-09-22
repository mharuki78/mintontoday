import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "./database";
import { adminCredentials } from "@/db/schema";

const credentialSchema = z.object({ passwordHash: z.string().min(1), version: z.string().uuid(), updatedAt: z.number() });
export type AdminCredential = z.infer<typeof credentialSchema>;
const directory = process.env.CONTENT_DIR
  ? path.resolve(/* turbopackIgnore: true */ process.env.CONTENT_DIR)
  : path.join(process.cwd(), "data");
const file = path.join(directory, "admin-credentials.json");
let queue = Promise.resolve();

export async function getAdminCredential(): Promise<AdminCredential | null> {
  const db = getDatabase();
  if (db) {
    const [row] = await db.select().from(adminCredentials).where(eq(adminCredentials.id, "owner")).limit(1);
    return row ? credentialSchema.parse(row) : null;
  }
  try {
    return credentialSchema.parse(JSON.parse(await readFile(file, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

// Compare-and-swap prevents simultaneous changes from overwriting each other.
export async function replaceAdminCredential(expectedVersion: string | null, next: AdminCredential) {
  const db = getDatabase();
  if (db) {
    const rows = expectedVersion === null
      ? await db.insert(adminCredentials).values({ id: "owner", ...next }).onConflictDoNothing().returning({ id: adminCredentials.id })
      : await db.update(adminCredentials).set(next).where(and(eq(adminCredentials.id, "owner"), eq(adminCredentials.version, expectedVersion))).returning({ id: adminCredentials.id });
    return rows.length === 1;
  }
  let changed = false;
  const operation = queue.then(async () => {
    if ((await getAdminCredential())?.version !== (expectedVersion ?? undefined)) return;
    await mkdir(directory, { recursive: true });
    const temp = path.join(directory, `${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(next), { encoding: "utf8", mode: 0o600 });
    await rename(temp, file);
    changed = true;
  });
  queue = operation.catch(() => {});
  await operation;
  return changed;
}
