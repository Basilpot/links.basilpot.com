import { db } from "@/lib/db";
import { validUrl, visitorHash } from "@/lib/core";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await db.link.findUnique({ where: { id }, select: { url: true, enabled: true, profileId: true } });
  if (!link?.enabled || !validUrl(link.url)) return new Response("Link not found", { status: 404 });
  const hash = await visitorHash();
  await db.linkClick.create({ data: { linkId: id, profileId: link.profileId, visitorHash: hash } });
  return Response.redirect(link.url, 302);
}
