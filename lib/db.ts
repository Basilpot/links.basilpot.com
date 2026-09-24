import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "cloudflare:workers";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaD1(env.linkbio_db) });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;