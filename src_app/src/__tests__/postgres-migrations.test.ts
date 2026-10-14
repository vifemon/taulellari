import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  end: vi.fn(),
  query: vi.fn(),
  migrate: vi.fn(),
  delay: vi.fn(),
}));

vi.mock("pg", () => ({
  default: {
    Client: class {
      connect = mocks.connect;
      end = mocks.end;
      query = mocks.query;
    },
  },
}));
vi.mock("drizzle-orm/node-postgres", () => ({ drizzle: (client: unknown) => client }));
vi.mock("drizzle-orm/node-postgres/migrator", () => ({ migrate: mocks.migrate }));
vi.mock("node:timers/promises", () => ({ setTimeout: mocks.delay }));

import { migratePostgres } from "../../scripts/migrate-postgres.mjs";

describe("PostgreSQL startup migrations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.connect.mockResolvedValue(undefined);
    mocks.end.mockResolvedValue(undefined);
    mocks.query.mockResolvedValue(undefined);
    mocks.migrate.mockResolvedValue(undefined);
    mocks.delay.mockResolvedValue(undefined);
  });

  it("rejects missing configuration without connecting", async () => {
    await expect(migratePostgres("")).rejects.toThrow("DATABASE_URL is required");
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("waits for PostgreSQL, locks the migration session and closes it on success", async () => {
    mocks.connect.mockRejectedValueOnce(Object.assign(new Error(), { code: "ECONNREFUSED" }));

    await migratePostgres("postgresql://test:test@localhost/test");

    expect(mocks.connect).toHaveBeenCalledTimes(2);
    expect(mocks.delay).toHaveBeenCalledWith(2000);
    expect(mocks.query).toHaveBeenCalledWith("SELECT pg_advisory_lock(825301, 1)");
    expect(mocks.query.mock.invocationCallOrder[1]).toBeLessThan(mocks.migrate.mock.invocationCallOrder[0]);
    expect(mocks.migrate).toHaveBeenCalledTimes(1);
    expect(mocks.end).toHaveBeenCalledTimes(2);
  });

  it("propagates SQL failures without retrying and releases the connection", async () => {
    const error = Object.assign(new Error("Invalid migration"), { code: "42601" });
    mocks.migrate.mockRejectedValue(error);

    await expect(migratePostgres("postgresql://test:test@localhost/test")).rejects.toBe(error);

    expect(mocks.migrate).toHaveBeenCalledTimes(1);
    expect(mocks.end).toHaveBeenCalledTimes(1);
    expect(mocks.delay).not.toHaveBeenCalled();
  });

  it("fails immediately on invalid credentials", async () => {
    const error = Object.assign(new Error(), { code: "28P01" });
    mocks.connect.mockRejectedValue(error);

    await expect(migratePostgres("postgresql://test:test@localhost/test")).rejects.toBe(error);

    expect(mocks.connect).toHaveBeenCalledTimes(1);
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.end).toHaveBeenCalledTimes(1);
  });

  it("stops after a bounded number of connection attempts", async () => {
    mocks.connect.mockRejectedValue(Object.assign(new Error(), { code: "57P03" }));

    await expect(migratePostgres("postgresql://test:test@localhost/test")).rejects.toMatchObject({ code: "57P03" });

    expect(mocks.connect).toHaveBeenCalledTimes(12);
    expect(mocks.end).toHaveBeenCalledTimes(12);
    expect(mocks.migrate).not.toHaveBeenCalled();
  });
});
