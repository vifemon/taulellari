import { describe, expect, it } from "vitest";

describe("backend test environment", () => {
  it("runs TypeScript logic in Vitest", () => {
    const sum = (a: number, b: number) => a + b;

    expect(sum(2, 3)).toBe(5);
  });
});
