import assert from "node:assert/strict";
import { db } from "../lib/db";
import { provisionUser } from "../lib/identity";

async function main() {
  const suffix = Date.now().toString(36);
  const email = `identity-${suffix}@example.test`;
  const workosId = `user_${suffix}`;
  const legacy = await db.user.create({ data: { email, passwordHash: "legacy-hash" } });
  try {
    await assert.rejects(provisionUser({ id: workosId, email, emailVerified: false }), /Verify email/);
    assert.equal(await provisionUser({ id: workosId, email, emailVerified: true }), legacy.id);
    assert.equal(await provisionUser({ id: workosId, email, emailVerified: true }), legacy.id);
    const linked = await db.user.findUniqueOrThrow({ where: { id: legacy.id } });
    assert.equal(linked.workosId, workosId);
    assert.equal(linked.passwordHash, null);
    console.log("Verified WorkOS identity links legacy account once; unverified identity rejected: passed");
  } finally {
    await db.user.delete({ where: { id: legacy.id } });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
