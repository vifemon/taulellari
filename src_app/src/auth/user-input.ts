import { normalizeEmail } from "./email";
import { validatePassword } from "./password";

export type RegisterInput = {
  email: string;
  nombre: string;
  apellidos: string;
  password: string;
};

export type ProfileInput = {
  email: string;
  nombre: string;
  apellidos: string;
  password?: string;
};

export function parseRegisterInput(body: unknown): RegisterInput | null {
  if (!isObject(body)) {
    return null;
  }

  const email = normalizeEmail(body.email);
  const nombre = normalizeName(body.nombre);
  const apellidos = normalizeName(body.apellidos);
  const password = validatePassword(body.password);

  if (!email || !nombre || !apellidos || !password) {
    return null;
  }

  return { email, nombre, apellidos, password };
}

export function parseProfileInput(body: unknown): ProfileInput | null {
  if (!isObject(body)) {
    return null;
  }

  const email = normalizeEmail(body.email);
  const nombre = normalizeName(body.nombre);
  const apellidos = normalizeName(body.apellidos);
  const password = body.password ? validatePassword(body.password) : undefined;

  if (!email || !nombre || !apellidos || (body.password && !password)) {
    return null;
  }

  return { email, nombre, apellidos, password: password ?? undefined };
}

export async function readJsonObject(request: Request) {
  try {
    const body: unknown = await request.json();
    return isObject(body) ? body : null;
  } catch {
    return null;
  }
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  if (!text || text.length > 80) {
    return null;
  }

  return text;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
