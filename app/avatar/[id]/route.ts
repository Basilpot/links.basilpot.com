import { db } from "@/lib/db";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await db.profile.findUnique({ where: { id }, select: { avatar: true, avatarType: true, updatedAt: true } });
  if (!profile?.avatar || !profile.avatarType) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(profile.avatar), { headers: { "content-type": profile.avatarType, "cache-control": "public, max-age=3600", "last-modified": profile.updatedAt.toUTCString(), "x-content-type-options": "nosniff" } });
}
