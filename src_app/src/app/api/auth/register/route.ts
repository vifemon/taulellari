import { cookies } from "next/headers";

import {
  createSessionToken,
  getAuthSecret,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/auth/session";
import { hashPassword } from "@/auth/password";
import { parseRegisterInput, readJsonObject } from "@/auth/user-input";
import { createUser, findUserByEmail } from "@/db/repositories";
import { API_ERROR_CODES } from "@/i18n/error-codes";

export async function POST(request: Request) {
  const input = parseRegisterInput(await readJsonObject(request));

  if (!input) {
    return Response.json({ error: API_ERROR_CODES.invalidRegistration }, { status: 400 });
  }

  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    return Response.json({ error: API_ERROR_CODES.emailTaken }, { status: 409 });
  }

  const user = await createUser({
    email: input.email,
    nombre: input.nombre,
    apellidos: input.apellidos,
    passwordHash: await hashPassword(input.password),
  });
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken(user.id, getAuthSecret()),
    sessionCookieOptions(),
  );

  return Response.json({ user }, { status: 201 });
}
