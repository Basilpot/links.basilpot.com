import assert from "node:assert/strict";
import { Client } from "pg";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const suffix = Date.now().toString(36);
const email = `smoke-${suffix}@example.test`;
const username = `smoke${suffix}`;
const db = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await db.connect();
  const created = await db.query('INSERT INTO "User" (id, email, "workosId") VALUES (gen_random_uuid(), $1, $2) RETURNING id', [email, `user_${suffix}`]);
  const userId = created.rows[0].id;
  const profile = await db.query('INSERT INTO "Profile" (id, "userId", username, "displayName", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, now()) RETURNING id', [userId, username, "Smoke Tester"]);
  const profileId = profile.rows[0].id;
  const link = await db.query('INSERT INTO "Link" (id, "profileId", title, url, position, "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, 0, now()) RETURNING id', [profileId, "Smoke link", "https://example.com"]);
  const linkId = link.rows[0].id;

  for (const path of ["/login", "/signup"]) {
    const response = await fetch(new URL(path, base), { redirect: "manual" });
    assert.ok([302, 303, 307, 308].includes(response.status), `${path} redirects`);
    assert.match(response.headers.get("location") ?? "", /^https:\/\//, `${path} goes to AuthKit`);
  }
  const dashboard = await fetch(new URL("/dashboard", base), { redirect: "manual" });
  assert.ok([302, 303, 307, 308].includes(dashboard.status), "dashboard requires sign-in");
  const page = await fetch(new URL(`/${username}`, base));
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Smoke link/);
  await fetch(new URL(`/${username}`, base));
  const click = await fetch(new URL(`/r/${linkId}`, base), { redirect: "manual" });
  assert.equal(click.status, 302);
  assert.equal(click.headers.get("location"), "https://example.com/");
  const events = await db.query('SELECT (SELECT count(*)::int FROM "PageView" WHERE "profileId" = $1) AS views, (SELECT count(DISTINCT "visitorHash")::int FROM "PageView" WHERE "profileId" = $1) AS visitors, (SELECT count(*)::int FROM "LinkClick" WHERE "linkId" = $2) AS clicks', [profileId, linkId]);
  assert.ok(events.rows[0].views >= 2);
  assert.equal(events.rows[0].visitors, 1);
  assert.equal(events.rows[0].clicks, 1);
  console.log("AuthKit redirects, protected dashboard, public views, unique visitors, and tracked click: passed");
} finally {
  await db.query('DELETE FROM "User" WHERE email = $1', [email]).catch(() => {});
  await db.end();
}
