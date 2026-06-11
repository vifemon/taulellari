import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import Database from "better-sqlite3";
import path from "node:path";
import { Pool } from "pg";

import * as pgSchema from "./schema";
import * as sqliteSchema from "./schema.sqlite";

const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
  pgDb?: NodePgDatabase<typeof pgSchema>;
  sqlite?: Database.Database;
  sqliteDb?: BetterSQLite3Database<typeof sqliteSchema>;
};

export function isDevelopmentDatabase() {
  return process.env.NODE_ENV === "development";
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize the database client");
  }

  return databaseUrl;
}

function getSqlitePath() {
  const sqliteUrl = process.env.SQLITE_DATABASE_URL ?? "file:./dev.db";
  const filePath = sqliteUrl.startsWith("file:")
    ? sqliteUrl.slice("file:".length)
    : sqliteUrl;

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);
}

export function getPool() {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return globalForDb.pgPool;
}

export function getPgDb() {
  if (!globalForDb.pgDb) {
    globalForDb.pgDb = drizzlePg(getPool(), { schema: pgSchema });
  }

  return globalForDb.pgDb;
}

export function getSqliteDb() {
  if (!globalForDb.sqlite) {
    globalForDb.sqlite = new Database(getSqlitePath());
    globalForDb.sqlite.pragma("foreign_keys = ON");
  }

  if (!globalForDb.sqliteDb) {
    globalForDb.sqliteDb = drizzleSqlite(globalForDb.sqlite, {
      schema: sqliteSchema,
    });
  }

  return globalForDb.sqliteDb;
}
