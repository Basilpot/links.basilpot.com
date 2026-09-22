import Link from "next/link";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { PublicProfile } from "@/components/public-profile";
import { isPro } from "@/lib/core";
import { recordView } from "@/lib/analytics";

export default async function Home() {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").hostname;
  const profile = host && host !== appHost ? await db.profile.findUnique({ where: { customDomain: host }, include: { links: { where: { enabled: true }, orderBy: { position: "asc" } } } }) : null;
  if (profile && isPro(profile)) { await recordView(profile.id); return <PublicProfile profile={profile} />; }
  return <main className="mx-auto max-w-5xl px-6"><header className="flex items-center justify-between py-8"><span className="text-xl font-bold tracking-tight">linkbio</span><Link className="text-sm font-medium" href="/login">Log in</Link></header><section className="max-w-2xl py-24 sm:py-32"><p className="mb-5 text-sm font-semibold text-muted-foreground">Simple pages. Useful numbers.</p><h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">One link for everything you want to share.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Add up to 15 links free. Know exactly which links people click. No unnecessary creator platform features.</p><div className="mt-9 flex flex-wrap gap-3"><Link className="button" href="/signup">Create your page</Link><Link className="button-plain" href="/example">View example</Link></div></section><footer className="border-t border-border py-8 text-sm text-muted-foreground">A small, fast home for your links.</footer></main>;
}
