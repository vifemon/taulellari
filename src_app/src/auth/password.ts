import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function validatePassword(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  if (value.length < 8 || value.length > 128) {
    return null;
  }

  return value;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}
