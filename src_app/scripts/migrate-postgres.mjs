import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const migrationsFolder = fileURLToPath(new URL("../drizzle/", import.meta.url));
const transientErrors = new Set(["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "57P03"]);

export async function migratePostgres(connectionString) {
  if (!connectionString?.trim()) {
    throw new Error("DATABASE_URL is required");
  }

  let client;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const candidate = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      await candidate.connect();
      client = candidate;
      break;
    } catch (error) {
      await candidate.end().catch(() => undefined);
      if (!transientErrors.has(error.code) || attempt === 12) {
        throw error;
      }
      console.log(`Waiting for PostgreSQL (${attempt}/12)...`);
      await delay(2000);
    }
  }

  try {
    // Serialize startup migrations if two app containers overlap during an update.
    await client.query("SET lock_timeout = '60s'");
    await client.query("SELECT pg_advisory_lock(825301, 1)");
    console.log("Applying pending PostgreSQL migrations...");
    await migrate(drizzle(client), { migrationsFolder });
    console.log("PostgreSQL migrations complete.");
  } finally {
    // Closing the session also releases the advisory lock, including on failure.
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  migratePostgres(process.env.DATABASE_URL).catch((error) => {
    // Do not print SQL, connection strings or credentials in container logs.
    const code = typeof error.code === "string" && /^[A-Z0-9_]+$/.test(error.code)
      ? error.code
      : "STARTUP_ERROR";
    console.error(`PostgreSQL migration failed (${code}); application startup aborted.`);
    process.exitCode = 1;
  });
}
