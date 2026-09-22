import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicProfile } from "@/components/public-profile";
import { recordView } from "@/lib/analytics";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await db.profile.findUnique({ where: { username }, select: { displayName: true, bio: true, id: true, avatar: true, updatedAt: true } });
  if (!profile) return {};
  return { title: `${profile.displayName} — linkbio`, description: profile.bio || `Links from ${profile.displayName}`, openGraph: { images: profile.avatar ? [`/avatar/${profile.id}?v=${profile.updatedAt.getTime()}`] : [] } };
}
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await db.profile.findUnique({ where: { username }, include: { links: { where: { enabled: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } });
  if (!profile) notFound();
  await recordView(profile.id);
  return <PublicProfile profile={profile} />;
}
