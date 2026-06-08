import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { normalizeEmail } from "@/auth/email";
import {
  createSessionToken,
  getAuthSecret,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/auth/session";
import { getDb } from "@/db/client";
import { usuarios } from "@/db/schema";

type LoginBody = {
  email?: unknown;
};

export async function POST(request: Request) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);

  if (!email) {
    return Response.json({ error: "Email invalido" }, { status: 400 });
  }

  const authSecret = getAuthSecret();
  const db = getDb();
  const [createdUser] = await db
    .insert(usuarios)
    .values({ email })
    .onConflictDoNothing({ target: usuarios.email })
    .returning({ id: usuarios.id, email: usuarios.email });

  const user =
    createdUser ??
    (
      await db
        .select({ id: usuarios.id, email: usuarios.email })
        .from(usuarios)
        .where(eq(usuarios.email, email))
        .limit(1)
    )[0];

  if (!user) {
    return Response.json({ error: "No se pudo iniciar sesion" }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken(user.id, authSecret),
    sessionCookieOptions(),
  );

  return Response.json(
    { user },
    { status: createdUser ? 201 : 200 },
  );
}

async function readJson(request: Request): Promise<LoginBody | null> {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}
