import nextEnv from "@next/env";
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
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
const migrationsDir = path.join(projectDir, "drizzle-dev");
const migrations = readdirSync(migrationsDir)
  .filter((filename) => filename.endsWith(".sql"))
  .sort()
  .map((filename) => ({
    name: filename,
    sql: readFileSync(path.join(migrationsDir, filename), "utf8"),
  }));

const db = new Database(databasePath);
db.exec("CREATE TABLE IF NOT EXISTS __drizzle_dev_migrations (name TEXT PRIMARY KEY);");

for (const migration of migrations) {
  const alreadyApplied = db
    .prepare("SELECT 1 FROM __drizzle_dev_migrations WHERE name = ?")
    .get(migration.name);

  if (!alreadyApplied) {
    db.exec(migration.sql);
    db.prepare("INSERT INTO __drizzle_dev_migrations (name) VALUES (?)").run(
      migration.name,
    );
  }
}
db.close();

console.log(`SQLite dev database ready at ${databasePath}`);
