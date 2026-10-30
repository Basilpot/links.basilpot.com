import Link from "next/link";
import Image from "next/image";
import { Eye, ExternalLink, LogOut, MousePointerClick, Percent, Settings, Users } from "lucide-react";
import { logout } from "@/app/actions";
import { CopyLinkButton } from "@/components/copy-link-button";
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
  const publicUrl = `${base.replace(/\/$/, "")}/${profile.username}`;
  const cards = [
    { label: "Views", value: metrics.views.toLocaleString(), Icon: Eye },
    { label: "Unique visitors", value: metrics.visitors.toLocaleString(), Icon: Users },
    { label: "Clicks", value: metrics.clicks.toLocaleString(), Icon: MousePointerClick },
    { label: "Click-through rate", value: `${metrics.ctr.toFixed(1)}%`, Icon: Percent },
  ];
  const ranges = [["7", "7 days", 7], ["30", "30 days", 30], ["all", "All time", null]] as const;
  return <main id="main" className="mx-auto max-w-5xl px-5 pb-20">
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5"><Link href="/" className="inline-flex items-center"><Image src="/logo.svg" alt="LINKS by Basilpot" width={176} height={33} priority /></Link><nav aria-label="Account" className="flex items-center gap-1 text-sm"><Link href="/settings" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 font-medium hover:bg-muted"><Settings size={16} aria-hidden="true"/>Settings</Link><form action={logout}><button className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut size={16} aria-hidden="true"/>Log out</button></form></nav></header>
    <div className="mt-10 flex flex-wrap items-end justify-between gap-5"><div className="min-w-0"><p className="text-sm text-muted-foreground">Dashboard</p><h1 className="mt-1 truncate text-3xl font-semibold">{profile.displayName}</h1><p className="mt-1 truncate text-sm text-muted-foreground">{publicUrl.replace(/^https?:\/\//, "")}</p></div><div className="flex flex-wrap gap-2"><CopyLinkButton url={publicUrl}/><a href={`/${profile.username}`} target="_blank" rel="noopener noreferrer" className="button-plain min-h-8 text-sm font-medium">View page<ExternalLink size={14} aria-hidden="true"/><span className="sr-only">(opens in new tab)</span></a></div></div>
    <section aria-labelledby="analytics-title" className="mt-10"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="analytics-title" className="text-lg font-semibold">Analytics</h2><nav aria-label="Date range" className="segmented">{ranges.map(([value, label, d]) => <Link key={value} href={`/dashboard?range=${value}`} aria-current={days === d ? "page" : undefined}>{label}</Link>)}</nav></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{cards.map(({ label, value, Icon }) => <div key={label} className="panel"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon size={15} aria-hidden="true"/>{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p></div>)}</div></section>
    <section aria-labelledby="links-title" className="mt-12"><div className="mb-5 flex items-center justify-between"><h2 id="links-title" className="text-lg font-semibold">Links <span className="text-sm font-normal text-muted-foreground">({links.length})</span></h2><LinkEditor/></div>
      <LinkList key={links.map(link => link.id).join(",")} links={links} clicks={Object.fromEntries(metrics.perLink)}/>
    </section></main>;
}
