import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Next.js reloads modules frequently in dev. Without this guard, every
// reload would create a brand-new PrismaClient (and a new pool of MySQL
// connections) instead of reusing one. In production there's only ever
// one instance anyway, so this only matters locally.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires a driver adapter for every database — there's no more
// "just works" engine baked into @prisma/client. PrismaMariaDb also covers
// MySQL.
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
