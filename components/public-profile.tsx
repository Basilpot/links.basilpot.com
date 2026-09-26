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
  return <main className={`profile-page min-h-screen ${styles[theme] ?? styles.paper}`}>
    <section className="relative h-[42svh] min-h-64 max-h-[34rem] w-full overflow-hidden" aria-label="Profile image">
      {profile.avatarPath ? <Image src={imageUrl(profile.avatarPath)} alt="" fill sizes="100vw" unoptimized className="object-cover" /> : <div aria-hidden="true" className="grid size-full place-items-center bg-[var(--link)] text-7xl font-semibold">{profile.displayName[0]?.toUpperCase()}</div>}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-transparent to-[var(--profile-bg)]" />
    </section>
    <div className="relative z-10 mx-auto -mt-16 flex max-w-md flex-col items-center px-5 pb-10 text-center">
      <h1 className="text-3xl font-bold tracking-[-.03em]">{profile.displayName}</h1>
      {profile.bio && <p className="mt-5 max-w-sm whitespace-pre-wrap leading-6 opacity-75">{profile.bio}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-5">{socialPlatforms.flatMap(platform => { const url = socials[platform]; if (typeof url !== "string") return []; return [<a key={platform} href={url} aria-label={platform} className="opacity-75 hover:opacity-100" rel="me noopener noreferrer" target={platform === "email" ? undefined : "_blank"}><span className="grid size-8 place-items-center rounded-full border border-[var(--line)]"><SocialIcon platform={platform} className="size-4"/></span></a>]; })}</div>
      <div className="mt-8 w-full space-y-3">{profile.links.map(link => <a key={link.id} href={example ? link.url : `/r/${link.id}`} target="_blank" rel="nofollow noopener noreferrer" className="relative flex min-h-16 items-center justify-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--link)] px-12 py-4 font-semibold shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2">{link.imagePath && <Image src={imageUrl(link.imagePath)} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-full object-cover"/>}<span className="min-w-0 text-center"><span className="block truncate">{link.title}</span>{link.description && <span className="mt-1 block text-sm font-normal opacity-75">{link.description}</span>}</span><ArrowUpRight aria-hidden="true" className="absolute end-5 size-4 opacity-50"/></a>)}</div>
      <Link href="/" className="mt-16 inline-flex items-center gap-1.5 text-xs font-medium opacity-55">Made with<span role="img" aria-label="LINKS by Basilpot" className="h-3.5 w-19 bg-current [mask:url(/logo.svg)_no-repeat_center/contain] [-webkit-mask:url(/logo.svg)_no-repeat_center/contain]" /></Link>
    </div>
  </main>;
}
