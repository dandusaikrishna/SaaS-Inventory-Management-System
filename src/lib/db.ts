import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function getConnectionString() {
  if (!process.env.DATABASE_URL) {
    loadEnv({ path: ".env.local" });
    loadEnv({ path: ".env" });
  }

  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_DATABASE && process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD
      ? `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DATABASE}`
      : undefined
  );
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const poolOptions: PoolConfig = { connectionString };
  if (process.env.PGSSLMODE === "no-verify") {
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
