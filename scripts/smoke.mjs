import assert from "node:assert/strict";
import { Client } from "pg";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const suffix = Date.now().toString(36);
const email = `smoke-${suffix}@example.test`;
const username = `smoke${suffix}`;
const cookies = new Map();
const db = new Client({ connectionString: process.env.DATABASE_URL });

function decode(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#x27;", "'");
}
function hidden(html) {
  const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
  assert.ok(form, "form exists");
  const data = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*type="hidden"[^>]*>/g)) {
    const name = input[0].match(/name="([^"]+)"/)?.[1];
    const value = input[0].match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) data.append(decode(name), decode(value));
  }
  return data;
}
async function request(path, options = {}) {
  let url = new URL(path, base);
  for (let n = 0; n < 8; n++) {
    const response = await fetch(url, { ...options, redirect: "manual", headers: { origin: base, ...options.headers, cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") } });
    for (const value of response.headers.getSetCookie()) {
      const [name, cookie] = value.split(";", 1)[0].split("=");
      if (name) cookies.set(name, cookie);
    }
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    url = new URL(response.headers.get("location"), url);
    options = {};
  }
  throw new Error("Too many redirects");
}
async function submit(path, fields) {
  const page = await request(path);
  assert.equal(page.status, 200);
  const html = await page.text();
  const data = hidden(path === "/dashboard" ? html.slice(html.indexOf('id="link-form"')) : html);
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return request(path, { method: "POST", body: data });
}

try {
  await db.connect();
  let result = await submit("/signup", { email, password: "smoke-test-password-123" });
  assert.equal(result.status, 200, "signup response");
  assert.match(result.url, /\/claim$/, "signup goes to claim");
  result = await submit("/claim", { username });
  assert.equal(result.status, 200, "claim response");
  assert.match(result.url, /\/dashboard$/, "claim goes to dashboard");
  const avatar = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6dr0AAAAASUVORK5CYII=", "base64")], { type: "image/png" });
  const settingsPage = await request("/settings");
  const settingsData = hidden(await settingsPage.text());
  for (const [name, value] of Object.entries({ username, displayName: "Smoke Tester", bio: "Testing links", theme: "ink", instagram: "https://instagram.com/example" })) settingsData.append(name, value);
  settingsData.append("avatar", avatar, "avatar.png");
  result = await request("/settings", { method: "POST", body: settingsData });
  assert.equal(result.status, 200, "profile saved");
  const savedProfile = await db.query('SELECT "avatarType", socials FROM "Profile" WHERE username = $1', [username]);
  assert.equal(savedProfile.rows[0].avatarType, "image/png");
  assert.equal(savedProfile.rows[0].socials.instagram, "https://instagram.com/example");
  const dashboardPage = await request("/dashboard");
  const dashboardHtml = await dashboardPage.text();
  const linkAction = hidden(dashboardHtml.slice(dashboardHtml.indexOf('id="link-form"')));
  result = await submit("/dashboard", { title: "Smoke link", url: "https://example.com", enabled: "on" });
  assert.equal(result.status, 200, "link response");
  const link = await db.query('SELECT id FROM "Link" WHERE title = $1 AND "profileId" = (SELECT id FROM "Profile" WHERE username = $2)', ["Smoke link", username]);
  assert.equal(link.rowCount, 1, "link stored");
  const profile = await request(`/${username}`);
  assert.equal(profile.status, 200);
  const profileHtml = await profile.text();
  assert.match(profileHtml, /Smoke link/);
  assert.match(profileHtml, /Smoke Tester/);
  assert.match(profileHtml, /instagram/);
  await request(`/${username}`);
  const click = await fetch(new URL(`/r/${link.rows[0].id}`, base), { redirect: "manual" });
  assert.equal(click.status, 302);
  assert.equal(click.headers.get("location"), "https://example.com/");
  const events = await db.query('SELECT (SELECT count(*) FROM "PageView" WHERE "profileId" = p.id) AS views, (SELECT count(DISTINCT "visitorHash") FROM "PageView" WHERE "profileId" = p.id) AS visitors, (SELECT count(*) FROM "LinkClick" WHERE "profileId" = p.id) AS clicks FROM "Profile" p WHERE username = $1', [username]);
  assert.ok(Number(events.rows[0].views) >= 2, "views stored");
  assert.equal(Number(events.rows[0].visitors), 1, "unique visitor deduped");
  assert.equal(Number(events.rows[0].clicks), 1, "click stored");
  const editPage = await request(`/dashboard?edit=${link.rows[0].id}`);
  const editHtml = await editPage.text();
  const editData = hidden(editHtml.slice(editHtml.indexOf('id="link-form"')));
  for (const [name, value] of Object.entries({ id: link.rows[0].id, title: "Edited smoke link", url: "https://example.org", enabled: "on" })) editData.append(name, value);
  await request(`/dashboard?edit=${link.rows[0].id}`, { method: "POST", body: editData });
  const edited = await db.query('SELECT title, url FROM "Link" WHERE id = $1', [link.rows[0].id]);
  assert.equal(edited.rows[0].title, "Edited smoke link");
  assert.equal(edited.rows[0].url, "https://example.org");
  const deletePage = await request("/dashboard");
  const deleteHtml = await deletePage.text();
  const labelIndex = deleteHtml.indexOf('aria-label="Delete Edited smoke link"');
  assert.ok(labelIndex > 0, "delete button exists");
  const deleteData = hidden(deleteHtml.slice(deleteHtml.lastIndexOf("<form", labelIndex)));
  await request("/dashboard", { method: "POST", body: deleteData });
  const removed = await db.query('SELECT "deletedAt" FROM "Link" WHERE id = $1', [link.rows[0].id]);
  assert.ok(removed.rows[0].deletedAt, "link hidden");
  const historicalClicks = await db.query('SELECT count(*)::int AS count FROM "LinkClick" WHERE "linkId" = $1', [link.rows[0].id]);
  assert.equal(historicalClicks.rows[0].count, 1, "historical click preserved");
  assert.equal((await request(`/r/${link.rows[0].id}`)).status, 404, "deleted link no longer redirects");
  for (let i = 1; i <= 15; i++) await db.query('INSERT INTO "Link" (id, "profileId", title, url, position, enabled, "createdAt", "updatedAt") VALUES (gen_random_uuid(), (SELECT id FROM "Profile" WHERE username = $1), $2, $3, $4, true, now(), now())', [username, `Link ${i}`, "https://example.com", i]);
  const orderPage = await request("/dashboard");
  const orderHtml = await orderPage.text();
  const moveIndex = orderHtml.indexOf('aria-label="Move Link 1 down"');
  assert.ok(moveIndex > 0, "move control exists");
  const moveData = hidden(orderHtml.slice(orderHtml.lastIndexOf("<form", moveIndex)));
  moveData.append("direction", "down");
  await request("/dashboard", { method: "POST", body: moveData });
  const order = await db.query('SELECT title, position FROM "Link" WHERE "profileId" = (SELECT id FROM "Profile" WHERE username = $1) AND title IN ($2, $3) ORDER BY position', [username, "Link 1", "Link 2"]);
  assert.deepEqual(order.rows.map(row => row.title), ["Link 2", "Link 1"], "reorder persisted");
  linkAction.append("title", "Sixteenth link");
  linkAction.append("url", "https://example.com");
  linkAction.append("enabled", "on");
  const limit = await request("/dashboard", { method: "POST", body: linkAction });
  assert.match(await limit.text(), /Free plan allows 15 links/, "sixteenth link rejected");
  console.log("signup → claim → profile upload → edit/delete/reorder → views → unique visitors → click history → free limit: passed");
} finally {
  await db.query('DELETE FROM "User" WHERE email = $1', [email]).catch(() => {});
  await db.end();
}
