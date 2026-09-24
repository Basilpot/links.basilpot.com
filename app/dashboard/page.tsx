import Link from "next/link";
import Image from "next/image";
import { ExternalLink, LogOut, Settings } from "lucide-react";
import { logout } from "@/app/actions";
import { LinkEditor } from "@/components/link-editor";
import { LinkList } from "@/components/link-list";
import { stats } from "@/lib/analytics";
import { currentProfile } from "@/lib/session";
import { db } from "@/lib/db";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const profile = await currentProfile();
  const { range = "7" } = await searchParams;
  const days = range === "all" ? null : range === "30" ? 30 : 7;
  const [links, metrics] = await Promise.all([db.link.findMany({ where: { profileId: profile.id, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }), stats(profile.id, days)]);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <main className="mx-auto max-w-5xl px-5 pb-20"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-6"><Link href="/" className="inline-flex items-center"><Image src="/logo.svg" alt="LINKS by Basilpot" width={176} height={33} priority /></Link><nav className="flex items-center gap-5 text-sm"><Link href="/settings" className="inline-flex items-center gap-1.5 font-medium"><Settings size={16}/>Settings</Link><form action={logout}><button className="inline-flex cursor-pointer items-center gap-1.5 text-muted-foreground"><LogOut size={16}/>Log out</button></form></nav></header>
    <div className="mt-10 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-muted-foreground">Dashboard</p><h1 className="mt-1 text-3xl font-semibold">{profile.displayName}</h1><a href={`/${profile.username}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">{base.replace(/^https?:\/\//, "")}/{profile.username}<ExternalLink size={13}/></a></div></div>
    <section className="mt-10"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Analytics</h2><div className="flex gap-3 text-sm"><Link className={days === 7 ? "font-semibold underline" : "text-muted-foreground"} href="/dashboard?range=7">7 days</Link><Link className={days === 30 ? "font-semibold underline" : "text-muted-foreground"} href="/dashboard?range=30">30 days</Link><Link className={days === null ? "font-semibold underline" : "text-muted-foreground"} href="/dashboard?range=all">All time</Link></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Views", metrics.views.toLocaleString()], ["Unique visitors", metrics.visitors.toLocaleString()], ["Clicks", metrics.clicks.toLocaleString()], ["CTR", `${metrics.ctr.toFixed(1)}%`]].map(([label, value]) => <div key={label} className="panel"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}</div></section>
    <section className="mt-12"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Links <span className="text-sm font-normal text-muted-foreground">({links.length})</span></h2><LinkEditor/></div>
      <LinkList key={links.map(link => link.id).join(",")} links={links} clicks={Object.fromEntries(metrics.perLink)}/>
    </section></main>;
}