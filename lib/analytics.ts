import { after } from "next/server";
import { db } from "@/lib/db";
import { visitorHash } from "@/lib/core";

export async function recordView(profileId: string) {
  const hash = await visitorHash();
  after(async () => { await db.pageView.create({ data: { profileId, visitorHash: hash } }); });
}
export async function stats(profileId: string, days: number | null) {
  const from = days ? new Date(Date.now() - days * 86400000) : new Date(0);
  const [views, clicks, visitors, perLink] = await Promise.all([
    db.pageView.count({ where: { profileId, createdAt: { gte: from } } }),
    db.linkClick.count({ where: { profileId, createdAt: { gte: from } } }),
    db.pageView.groupBy({ by: ["visitorHash"], where: { profileId, createdAt: { gte: from } } }).then(rows => rows.length),
    db.linkClick.groupBy({ by: ["linkId"], where: { profileId, createdAt: { gte: from } }, _count: true }),
  ]);
  return { views, clicks, visitors, perLink: new Map(perLink.map(row => [row.linkId, row._count])), ctr: views ? clicks / views * 100 : 0 };
}
