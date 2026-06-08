import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb } from "@/db/client";
import { usuarios } from "@/db/schema";
import { getAuthSecret, SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export type AuthUser = {
  id: number;
  email: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token, getAuthSecret());

  if (!session) {
    return null;
  }

  const [user] = await getDb()
    .select({ id: usuarios.id, email: usuarios.email })
    .from(usuarios)
    .where(eq(usuarios.id, session.userId))
    .limit(1);

  return user ?? null;
}
