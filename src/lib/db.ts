import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
if (process.env.DB_SSL_NO_VERIFY === "true") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { URL } from "url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function normalizeConnectionString(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const params = url.searchParams;

    if (process.env.DB_SSL_NO_VERIFY === "true") {
      params.set("sslmode", "no-verify");
    } else if (process.env.PGSSLMODE) {
      params.set("sslmode", process.env.PGSSLMODE);
    }

    if (params.get("sslmode") === "require" && !params.has("uselibpqcompat")) {
      params.set("uselibpqcompat", "true");
    }

    url.search = params.toString();
    return url.toString();
  } catch {
    return raw;
  }
}

function getConnectionString() {
  if (!process.env.DATABASE_URL) {
    loadEnv({ path: ".env.local" });
    loadEnv({ path: ".env" });
  }

  const raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    (process.env.POSTGRES_DATABASE && process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD
      ? `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DATABASE}`
      : undefined);

  return normalizeConnectionString(raw);
}

function shouldDisableTlsValidation(connectionString: string): boolean {
  if (process.env.DB_SSL_NO_VERIFY === "true") {
    return true;
  }

  if (process.env.PGSSLMODE === "no-verify") {
    return true;
  }

  try {
    const url = new URL(connectionString);
    return url.searchParams.get("sslmode") === "no-verify";
  } catch {
    return false;
  }
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const url = new URL(connectionString);
  const poolOptions: PoolConfig = {
    host: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    user: url.username || undefined,
    password: url.password || undefined,
    database: url.pathname?.slice(1) || undefined,
  };

  if (shouldDisableTlsValidation(connectionString)) {
    poolOptions.ssl = { rejectUnauthorized: false };
  }

  const pool = globalForPrisma.pgPool ?? new Pool(poolOptions);
  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
