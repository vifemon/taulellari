import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "../auth/session";
import { normalizeEmail } from "../auth/email";
import { hashPassword, validatePassword, verifyPassword } from "../auth/password";
import { parseProfileInput, parseRegisterInput } from "../auth/user-input";

describe("email auth helpers", () => {
  it("normalizes valid emails", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("rejects invalid emails", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("session helpers", () => {
  it("creates and verifies a signed session token", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken(7, "test-secret", now);

    expect(verifySessionToken(token, "test-secret", now)).toEqual({
      userId: 7,
      expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
    });
  });

  it("rejects tampered or expired session tokens", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken(7, "test-secret", now);

    expect(verifySessionToken(token.replace("7", "8"), "test-secret", now)).toBeNull();
    expect(
      verifySessionToken(
        token,
        "test-secret",
        now + SESSION_MAX_AGE_SECONDS * 1000 + 1,
      ),
    ).toBeNull();
  });
});

describe("password auth helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("correct horse");

    expect(hash).not.toBe("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("validates password length", () => {
    expect(validatePassword("1234567")).toBeNull();
    expect(validatePassword("12345678")).toBe("12345678");
  });
});

describe("auth input parsing", () => {
  it("parses register input and trims names", () => {
    expect(
      parseRegisterInput({
        email: " User@Example.COM ",
        nombre: "  Vicent ",
        apellidos: " Ferrer ",
        password: "12345678",
      }),
    ).toEqual({
      email: "user@example.com",
      nombre: "Vicent",
      apellidos: "Ferrer",
      password: "12345678",
    });
  });

  it("rejects invalid register and profile input", () => {
    expect(parseRegisterInput({ email: "bad", password: "12345678" })).toBeNull();
    expect(
      parseProfileInput({
        email: "user@example.com",
        nombre: "Vicent",
        apellidos: "Ferrer",
        password: "short",
      }),
    ).toBeNull();
  });
});
