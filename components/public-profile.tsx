import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Link as ProfileLink, Profile } from "@/generated/prisma/client";
import { socialPlatforms } from "@/lib/core";
import { imageUrl } from "@/lib/image-url";
import { SocialIcon } from "@/components/social-icons";

const styles: Record<string, string> = { paper: "theme-paper", ink: "theme-ink", sand: "theme-sand", sage: "theme-sage", lavender: "theme-lavender" };
export function PublicProfile({ profile, example = false }: { profile: Profile & { links: ProfileLink[] }; example?: boolean }) {
  const socials = profile.socials && typeof profile.socials === "object" && !Array.isArray(profile.socials) ? profile.socials as Record<string, unknown> : {};
  const theme = ["paper", "ink", "sand", "sage", "lavender"].includes(profile.theme) ? profile.theme : "paper";
  return <main className={`profile-page min-h-screen px-5 py-10 sm:py-16 ${styles[theme] ?? styles.paper}`}><div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center text-center">
    {profile.avatarPath ? <Image src={imageUrl(profile.avatarPath)} alt="" width={88} height={88} unoptimized className="size-22 rounded-full object-cover" /> : <div aria-hidden="true" className="grid size-22 place-items-center rounded-full border border-[var(--line)] bg-[var(--link)] text-3xl font-semibold">{profile.displayName[0]?.toUpperCase()}</div>}
    <h1 className="mt-5 text-3xl font-semibold tracking-[-.03em]">{profile.displayName}</h1>
    {profile.bio && <p className="mt-2 max-w-sm whitespace-pre-wrap leading-6 opacity-75">{profile.bio}</p>}
    <div className="mt-9 w-full space-y-3">{profile.links.map(link => <a key={link.id} href={example ? link.url : `/r/${link.id}`} target="_blank" rel="nofollow noopener noreferrer" className="flex items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--link)] px-5 py-4 text-left font-semibold shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2">{link.imagePath && <Image src={imageUrl(link.imagePath)} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-full object-cover"/>}<span className="min-w-0 flex-1"><span className="block truncate">{link.title}</span>{link.description && <span className="mt-1 block text-sm font-normal opacity-75">{link.description}</span>}</span><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 opacity-50"/></a>)}</div>
    <div className="mt-8 flex flex-wrap justify-center gap-5">{socialPlatforms.flatMap(platform => { const url = socials[platform]; if (typeof url !== "string") return []; return [<a key={platform} href={url} aria-label={platform} className="opacity-75 hover:opacity-100" rel="me noopener noreferrer" target={platform === "email" ? undefined : "_blank"}><span className="grid size-8 place-items-center rounded-full border border-[var(--line)]"><SocialIcon platform={platform} className="size-4"/></span></a>]; })}</div>
    <Link href="/" className="mt-auto inline-flex items-center gap-1.5 pt-20 text-xs font-medium opacity-55">Made with<span role="img" aria-label="LINKS by Basilpot" className="h-3.5 w-19 bg-current [mask:url(/logo.svg)_no-repeat_center/contain] [-webkit-mask:url(/logo.svg)_no-repeat_center/contain]" /></Link>
  </div></main>;
}
