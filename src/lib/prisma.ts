import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_POSTGRES_URL;

if (!process.env.DATABASE_URL && databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
