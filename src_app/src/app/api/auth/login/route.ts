import { cookies } from "next/headers";

import { normalizeEmail } from "@/auth/email";
import { validatePassword, verifyPassword } from "@/auth/password";
import {
  createSessionToken,
  getAuthSecret,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/auth/session";
import { findUserByEmail } from "@/db/repositories";
import { API_ERROR_CODES } from "@/i18n/error-codes";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const password = validatePassword(body?.password);

  if (!email || !password) {
    return Response.json({ error: API_ERROR_CODES.invalidCredentials }, { status: 400 });
  }

  const authSecret = getAuthSecret();
  const userWithPassword = await findUserByEmail(email);

  if (
    !userWithPassword ||
    !(await verifyPassword(password, userWithPassword.passwordHash))
  ) {
    return Response.json({ error: API_ERROR_CODES.invalidCredentials }, { status: 401 });
  }

  const user = {
    id: userWithPassword.id,
    email: userWithPassword.email,
    nombre: userWithPassword.nombre,
    apellidos: userWithPassword.apellidos,
  };

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken(user.id, authSecret),
    sessionCookieOptions(),
  );

  return Response.json(
    { user },
    { status: 200 },
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
