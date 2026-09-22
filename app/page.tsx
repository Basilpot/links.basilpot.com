import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { PublicProfile } from "@/components/public-profile";
import { isPro } from "@/lib/core";
import { recordView } from "@/lib/analytics";
import CircularGallery from "@/components/CircularGallery";

const stories = [
  { image: "/home-stories/creator-1.jpg", text: "Share your moments" },
  { image: "/home-stories/creator-2.jpg", text: "Share your work" },
  { image: "/home-stories/creator-3.jpg", text: "Share your passions" },
  { image: "/home-stories/creator-4.jpg", text: "Share your community" },
  { image: "/home-stories/creator-5.jpg", text: "Share your story" },
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
        <a href="https://github.com/Basilpot/links.basilpot.com" aria-label="View source on GitHub" target="_blank" rel="noopener noreferrer" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5"><path d="M12 .75a11.25 11.25 0 0 0-3.558 21.924c.563.105.77-.244.77-.543 0-.267-.01-.976-.016-1.916-3.133.681-3.795-1.51-3.795-1.51-.512-1.3-1.25-1.646-1.25-1.646-1.023-.699.078-.685.078-.685 1.13.08 1.725 1.16 1.725 1.16 1.004 1.722 2.634 1.225 3.276.937.102-.727.393-1.224.715-1.506-2.5-.284-5.129-1.25-5.129-5.563 0-1.229.44-2.233 1.16-3.022-.117-.285-.503-1.43.11-2.98 0 0 .944-.302 3.094 1.155A10.78 10.78 0 0 1 12 6.35c.956.005 1.92.13 2.82.38 2.15-1.457 3.092-1.155 3.092-1.155.615 1.55.229 2.695.113 2.98.722.789 1.158 1.793 1.158 3.022 0 4.324-2.634 5.276-5.143 5.555.404.35.764 1.04.764 2.096 0 1.513-.014 2.734-.014 3.106 0 .302.204.653.775.542A11.251 11.251 0 0 0 12 .75Z"/></svg></a>
        <span className="hidden sm:block"><Link href="/signup" className="button-plain text-sm font-semibold">Create your page</Link></span>
      </nav>
    </header>

    <section className="pt-16 text-center sm:pt-20 lg:pt-24" aria-labelledby="home-title">
      <div className="relative z-10 mx-auto max-w-4xl px-5">
        <span className="inline-flex rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground sm:text-sm">One page. Every link.</span>
        <h1 id="home-title" className="mx-auto mt-7 max-w-4xl text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl lg:text-7xl">One simple page for everything you want to share.</h1>
        <Link prefetch={false} className="button mt-9" href="/signup">Create your page <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <div className="relative mt-12 h-72 w-full text-foreground sm:mt-16 sm:h-96">
        <CircularGallery items={stories} bend={3} borderRadius={0.05} scrollEase={0.02} />
      </div>
    </section>

  </main>;
}
