// One-shot Supabase S3 → R2 copy for existing image objects. Run: node --env-file=.env scripts/migrate-images.mjs
// ponytail: bucket is public-read, so curl-fetch + `wrangler r2 object put` per key is enough for a handful of images.
import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PROJECT = "https://amkaxkwibayijmsjuioe.supabase.co"; // public bucket from the old Supabase stack
const OLD_BUCKET = "links-by-basilpot";

async function imagePaths() {
  const r = spawnSync("wrangler", ["d1", "execute", "linkbio-db", "--remote", "--command",
    `SELECT "avatarPath" AS p FROM "Profile" WHERE "avatarPath" IS NOT NULL UNION SELECT "imagePath" AS p FROM "Link" WHERE "imagePath" IS NOT NULL`, "--config", "wrangler.jsonc"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  const start = r.stdout.indexOf("[");
  const rows = JSON.parse(r.stdout.slice(start))[0].results;
  return rows.map(row => row.p).filter(Boolean);
}

let ok = 0, failed = 0, missing = 0;
for (const key of await imagePaths()) {
  const url = `${PROJECT}/storage/v1/object/public/${OLD_BUCKET}/${key}`;
  const response = await fetch(url);
  if (!response.ok) { console.log(`MISS ${key}`); missing++; continue; }
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const tmp = join(tmpdir(), `img-${Date.now()}-${ok}.bin`);
  writeFileSync(tmp, Buffer.from(await response.arrayBuffer()));
  const put = spawnSync("wrangler", ["r2", "object", "put", `linkbio-media/${key}`, "--file", tmp, "--remote", "--content-type", contentType], { stdio: "pipe", encoding: "utf8" });
  rmSync(tmp, { force: true });
  if (put.status === 0) { ok++; } else { failed++; console.log(`PUT FAIL ${key}:`, put.stderr.split("\n").filter(Boolean).slice(-2).join(" ")); }
}
console.log(`images: ${ok} copied, ${missing} missing source, ${failed} failed`);