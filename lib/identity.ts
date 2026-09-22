import type { User as WorkOSUser } from "@workos-inc/node";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function provisionUser(user: Pick<WorkOSUser, "id" | "email" | "emailVerified">) {
  const email = user.email.trim().toLowerCase();
  const byId = await db.user.findUnique({ where: { workosId: user.id } });
  if (byId) {
    if (byId.email !== email && user.emailVerified) await db.user.update({ where: { id: byId.id }, data: { email } });
    return byId.id;
  }
  const legacy = await db.user.findUnique({ where: { email } });
  if (legacy) {
    if (legacy.workosId) throw new Error("Email belongs to another WorkOS account");
    if (!user.emailVerified) throw new Error("Verify email before linking existing profile");
    await db.user.update({ where: { id: legacy.id }, data: { workosId: user.id, passwordHash: null } });
    return legacy.id;
  }
  try {
    return (await db.user.create({ data: { email, workosId: user.id } })).id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.user.findUnique({ where: { workosId: user.id } });
      if (existing) return existing.id;
    }
    throw error;
  }
}
