// One-shot Neon Postgres → D1 import. Run: node --env-file=.env scripts/migrate-pg-to-d1.mjs
// ponytail: dataset is small (hundreds of rows), so one SQL file + `wrangler d1 execute` per target is enough.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;
const url = process.env.PG_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Set PG_DATABASE_URL (or DATABASE_URL)");
const targets = process.argv.includes("--remote") ? ["--remote"] : ["--local", "--remote"];

const tables = {
  User: ["id", "email", "workosId", "passwordHash", "createdAt"],
  Profile: ["id", "userId", "username", "displayName", "bio", "avatarPath", "theme", "socials", "customDomain", "createdAt", "updatedAt"],
  Link: ["id", "profileId", "title", "description", "url", "imagePath", "position", "enabled", "deletedAt", "createdAt", "updatedAt"],
  PageView: ["id", "profileId", "visitorHash", "createdAt"],
  LinkClick: ["id", "profileId", "linkId", "visitorHash", "createdAt"],
};
const order = Object.keys(tables);

const esc = v => {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const client = new Client({ connectionString: url });
await client.connect();
const rows = {};
for (const table of order) {
  const columns = tables[table].join('", "');
  rows[table] = (await client.query(`SELECT "${columns}" FROM "${table}"`)).rows;
}
await client.end();

const out = [];
out.push("PRAGMA foreign_keys = OFF;");
for (const table of order) out.push(`DELETE FROM "${table}";`);
for (const table of order) {
  const cols = tables[table].map(c => `"${c}"`);
  for (let i = 0; i < rows[table].length; i += 200) {
    const batch = rows[table].slice(i, i + 200).map(r => `(${tables[table].map(c => esc(r[c])).join(",")})`).join(",");
    out.push(`INSERT OR REPLACE INTO "${table}" (${cols.join(",")}) VALUES ${batch};`);
  }
}
out.push("PRAGMA foreign_keys = ON;");

const dir = join(tmpdir(), "linkbio-d1-import");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const file = join(dir, "import.sql");
writeFileSync(file, out.join("\n"));
console.log(`wrote ${file} (${Object.entries(rows).map(([t, r]) => `${t}:${r.length}`).join(" ")})`);

for (const flag of targets) {
  const r = spawnSync("wrangler", ["d1", "execute", "linkbio-db", flag, "--file", file, "--config", "wrangler.jsonc"], { stdio: "inherit", env: { ...process.env, CLOUDFLARE_CONFIG_FILE: undefined } });
  if (r.status !== 0) process.exit(r.status ?? 1);
}