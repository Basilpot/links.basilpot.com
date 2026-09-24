// Smoke against the worker: node --env-file=.env scripts/smoke.mjs [--local]
// Hits /login + /dashboard (AuthKit), a disposable public profile, and /r/<id> tracking.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const flag = process.argv.includes("--local") ? "--local" : "--remote";

const d1 = sql => {
  const r = spawnSync("wrangler", ["d1", "execute", "linkbio-db", flag, "--command", sql, "--config", "wrangler.jsonc"], { encoding: "utf8" });
  assert.equal(r.status, 0, `wrangler failed: ${r.stderr ?? sql}`);
  return r.stdout;
};

const suffix = Date.now().toString(36);
const email = `smoke-${suffix}@example.test`;
const username = `smoke${suffix}`;
const userId = randomUUID();
const profileId = randomUUID();
const linkId = randomUUID();

const now = new Date().toISOString();
try {
  d1(`INSERT INTO "User" (id, email, "workosId") VALUES ('${userId}', '${email}', 'user_${suffix}')`);
  d1(`INSERT INTO "Profile" (id, "userId", username, "displayName", "updatedAt") VALUES ('${profileId}', '${userId}', '${username}', 'Smoke Tester', '${now}')`);
  d1(`INSERT INTO "Link" (id, "profileId", title, url, position, "updatedAt") VALUES ('${linkId}', '${profileId}', 'Smoke link', 'https://example.com', 0, '${now}')`);

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
  const out = d1(`SELECT (SELECT count(*) FROM "PageView" WHERE "profileId" = '${profileId}') AS views, (SELECT count(DISTINCT "visitorHash") FROM "PageView" WHERE "profileId" = '${profileId}') AS visitors, (SELECT count(*) FROM "LinkClick" WHERE "linkId" = '${linkId}') AS clicks`);
  const [counts] = JSON.parse(out.slice(out.indexOf("[")))[0].results;
  assert.ok(counts.views >= 2);
  assert.equal(counts.visitors, 1);
  assert.equal(counts.clicks, 1);
  console.log(`AuthKit redirects, protected dashboard, public views, unique visitors, tracked click: passed (${flag === "--local" ? "local D1" : "remote D1"})`);
} finally {
  d1(`DELETE FROM "User" WHERE email = '${email}'`);
}