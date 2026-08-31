import { cookies } from "next/headers";

import { findUserById } from "@/db/repositories";
import { getAuthSecret, SESSION_COOKIE_NAME, verifySessionToken } from "./session";
import type { AuthUser } from "./types";

export type { AuthUser } from "./types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token, getAuthSecret());

  if (!session) {
    return null;
  }

  return findUserById(session.userId);
}
