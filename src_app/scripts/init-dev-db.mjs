import nextEnv from "@next/env";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, "..");

const { loadEnvConfig } = nextEnv;

loadEnvConfig(projectDir, true);

const sqliteUrl = process.env.SQLITE_DATABASE_URL ?? "file:./dev.db";
const filePath = sqliteUrl.startsWith("file:")
  ? sqliteUrl.slice("file:".length)
  : sqliteUrl;
const databasePath = path.isAbsolute(filePath)
  ? filePath
  : path.join(projectDir, filePath);
const migrationPath = path.join(projectDir, "drizzle-dev", "0000_local_sqlite.sql");
const migration = readFileSync(migrationPath, "utf8");

const db = new Database(databasePath);
db.exec(migration);
db.close();

console.log(`SQLite dev database ready at ${databasePath}`);
