import { cookies } from "next/headers";

import { normalizeEmail } from "@/auth/email";
import {
  createSessionToken,
  getAuthSecret,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/auth/session";
import { findOrCreateUserByEmail } from "@/db/repositories";

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
  const { user, created } = await findOrCreateUserByEmail(email);

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
    { status: created ? 201 : 200 },
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
