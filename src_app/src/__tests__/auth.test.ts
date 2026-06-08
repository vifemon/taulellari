import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "../auth/session";
import { normalizeEmail } from "../auth/email";

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
