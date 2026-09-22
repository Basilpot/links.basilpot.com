import Image from "next/image";
import Link from "next/link";
import type { Link as ProfileLink, Profile } from "@/generated/prisma/client";
import { isPro, socialPlatforms, type SocialPlatform } from "@/lib/core";
import { imageUrl } from "@/lib/avatar-storage";

const icons: Record<SocialPlatform, string> = { instagram: "◎", x: "𝕏", github: "GH", linkedin: "in", youtube: "▶", facebook: "f", tiktok: "♪", website: "↗", email: "@" };
const styles: Record<string, string> = { paper: "theme-paper", ink: "theme-ink", sand: "theme-sand", sage: "theme-sage", lavender: "theme-lavender" };
export function PublicProfile({ profile, example = false }: { profile: Profile & { links: ProfileLink[] }; example?: boolean }) {
  const socials = profile.socials && typeof profile.socials === "object" && !Array.isArray(profile.socials) ? profile.socials as Record<string, unknown> : {};
  const theme = isPro(profile) || ["paper", "ink", "sand"].includes(profile.theme) ? profile.theme : "paper";
  return <main className={`profile-page min-h-screen px-5 py-10 sm:py-16 ${styles[theme] ?? styles.paper}`}><div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center text-center">
    {profile.avatarPath ? <Image src={imageUrl(profile.avatarPath)} alt="" width={88} height={88} unoptimized className="size-22 rounded-full object-cover" /> : <div aria-hidden="true" className="grid size-22 place-items-center rounded-full border border-[var(--line)] bg-[var(--link)] text-3xl font-semibold">{profile.displayName[0]?.toUpperCase()}</div>}
    <h1 className="mt-5 text-3xl font-semibold tracking-[-.03em]">{profile.displayName}</h1>
    {profile.bio && <p className="mt-2 max-w-sm whitespace-pre-wrap leading-6 opacity-75">{profile.bio}</p>}
    <div className="mt-9 w-full space-y-3">{profile.links.slice(0, isPro(profile) ? undefined : 15).map(link => <a key={link.id} href={example ? link.url : `/r/${link.id}`} rel="nofollow" className="flex items-center gap-4 rounded-full border border-[var(--line)] bg-[var(--link)] px-5 py-4 text-left font-semibold shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2">{link.imagePath && <Image src={imageUrl(link.imagePath)} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-full object-cover"/>}<span className="min-w-0 flex-1"><span className="block truncate">{link.title}</span>{link.description && <span className="mt-1 block text-sm font-normal opacity-75">{link.description}</span>}</span><span aria-hidden="true" className="opacity-50">↗</span></a>)}</div>
    <div className="mt-8 flex flex-wrap justify-center gap-5">{socialPlatforms.flatMap(platform => { const url = socials[platform]; if (typeof url !== "string") return []; const icon = icons[platform as SocialPlatform]; return [<a key={platform} href={url} aria-label={platform} className="opacity-75 hover:opacity-100" rel="me noopener noreferrer" target={platform === "email" ? undefined : "_blank"}><span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-[var(--line)] text-sm font-bold">{icon}</span></a>]; })}</div>
    {!isPro(profile) && <Link href="/" className="mt-auto pt-20 text-xs font-medium opacity-55">Made with LINKS by Basilpot</Link>}
  </div></main>;
}
