import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicProfile } from "@/components/public-profile";
import { recordView } from "@/lib/analytics";
import { imageUrl } from "@/lib/avatar-storage";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await db.profile.findUnique({ where: { username }, select: { displayName: true, bio: true, avatarPath: true } });
  if (!profile) return {};
  return { title: `${profile.displayName} — LINKS by Basilpot`, description: profile.bio || `Links from ${profile.displayName}`, openGraph: { images: profile.avatarPath ? [imageUrl(profile.avatarPath)] : [] } };
}
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await db.profile.findUnique({ where: { username }, include: { links: { where: { enabled: true, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } });
  if (!profile) notFound();
  await recordView(profile.id);
  return <PublicProfile profile={profile} />;
}
