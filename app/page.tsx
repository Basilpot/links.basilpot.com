import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { PublicProfile } from "@/components/public-profile";
import { isPro } from "@/lib/core";
import { recordView } from "@/lib/analytics";

const stories = [
  { src: "/home-stories/creator-1.jpg", alt: "Smiling child outdoors", position: "home-story-first" },
  { src: "/home-stories/creator-2.jpg", alt: "Community worker outdoors", position: "home-story-second" },
  { src: "/home-stories/creator-3.jpg", alt: "Woman embracing a dog", position: "home-story-center" },
  { src: "/home-stories/creator-4.jpg", alt: "Runners together", position: "home-story-fourth" },
  { src: "/home-stories/creator-5.jpg", alt: "Smiling supporter", position: "home-story-fifth" },
];

export default async function Home() {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").hostname;
  const profile = host && host !== appHost ? await db.profile.findUnique({ where: { customDomain: host }, include: { links: { where: { enabled: true, deletedAt: null }, orderBy: { position: "asc" } } } }) : null;
  if (profile && isPro(profile)) {
    await recordView(profile.id);
    return <PublicProfile profile={profile} />;
  }

  return <main className="min-h-screen overflow-hidden bg-background text-foreground">
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link href="/" className="inline-flex shrink-0 items-center"><Image src="/logo.svg" alt="Links by Basilpot" width={176} height={33} priority /></Link>
      <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-4">
        <Link href="/login" className="px-3 py-2 text-sm font-medium hover:underline">Log in</Link>
        <Link href="/signup" className="button-plain text-xs font-semibold sm:text-sm">Create your page</Link>
      </nav>
    </header>

    <section className="pt-16 text-center sm:pt-20 lg:pt-24" aria-labelledby="home-title">
      <div className="relative z-10 mx-auto max-w-4xl px-5">
        <span className="inline-flex rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground sm:text-sm">One page. Every link.</span>
        <h1 id="home-title" className="mx-auto mt-7 max-w-4xl text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl lg:text-7xl">One simple page for everything you want to share.</h1>
        <Link prefetch={false} className="button mt-9" href="/signup">Create your page <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <div className="home-gallery mx-auto mt-16 max-w-7xl sm:mt-20" aria-label="People sharing what matters to them">
        {stories.map(story => <div key={story.src} className={`home-story ${story.position}`}><Image src={story.src} alt={story.alt} fill sizes="(max-width: 640px) 30vw, 22vw" className="rounded-2xl object-cover sm:rounded-3xl" /></div>)}
      </div>
    </section>

    <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-2 border-t border-border px-5 py-7 text-center text-sm text-muted-foreground sm:flex-row sm:gap-6">
      <p>Your links, your profile, your story. Start with one page.</p>
      <Link href="/example" className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline">View example <ArrowRight className="size-4" aria-hidden="true" /></Link>
    </section>
  </main>;
}
