import { cookies } from "next/headers";

import { findUserById } from "@/db/repositories";
import { getAuthSecret, SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export type AuthUser = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token, getAuthSecret());

  if (!session) {
    return null;
  }

  return findUserById(session.userId);
}
