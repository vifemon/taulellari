import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "taulellari_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: number;
  expiresAt: number;
};

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required to manage sessions");
  }

  return secret;
}

export function createSessionToken(
  userId: number,
  secret: string,
  now = Date.now(),
) {
  const expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload, secret);

  return `${payload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): SessionPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [rawUserId, rawExpiresAt, signature] = parts;
  const userId = Number(rawUserId);
  const expiresAt = Number(rawExpiresAt);

  if (!Number.isSafeInteger(userId) || userId < 1) {
    return null;
  }

  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) {
    return null;
  }

  const payload = `${rawUserId}.${rawExpiresAt}`;

  if (!safeEqual(signature, sign(payload, secret))) {
    return null;
  }

  return { userId, expiresAt };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}
