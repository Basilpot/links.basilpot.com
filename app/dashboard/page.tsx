import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { logout, moveLink } from "@/app/actions";
import { LinkEditor } from "@/components/link-editor";
import { DeleteLinkConfirmation } from "@/components/delete-link-confirmation";
import { stats } from "@/lib/analytics";
import { isPro } from "@/lib/core";
import { currentProfile } from "@/lib/session";
import { db } from "@/lib/db";
import { BillingControls } from "@/components/billing-controls";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const profile = await currentProfile();
  const { range = "7" } = await searchParams;
  const pro = isPro(profile);
  const billingReady = !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && !!process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
  const lockedAll = range === "all" && !pro;
  const days = range === "all" && pro ? null : range === "30" || lockedAll ? 30 : 7;
  const [links, metrics] = await Promise.all([db.link.findMany({ where: { profileId: profile.id, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }), stats(profile.id, days)]);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <main className="mx-auto max-w-5xl px-5 pb-20"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-6"><Link href="/" className="inline-flex items-center"><Image src="/logo.svg" alt="LINKS by Basilpot" width={176} height={33} priority /></Link><nav className="flex items-center gap-5 text-sm"><Link href="/settings" className="font-medium">Settings</Link><form action={logout}><button className="cursor-pointer text-muted-foreground">Log out</button></form></nav></header>
    <div className="mt-10 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-muted-foreground">Dashboard · {isPro(profile) ? "Pro" : "Free"}</p><h1 className="mt-1 text-3xl font-semibold">{profile.displayName}</h1><a href={`/${profile.username}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">{base.replace(/^https?:\/\//, "")}/{profile.username}<ExternalLink size={13}/></a></div><BillingControls pro={isPro(profile)} customer={!!profile.paddleCustomerId} /></div>
    <section className="mt-10"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Analytics</h2><div className="flex gap-3 text-sm"><Link className={days === 7 ? "font-semibold underline" : "text-muted-foreground"} href="/dashboard?range=7">7 days</Link><Link className={days === 30 ? "font-semibold underline" : "text-muted-foreground"} href="/dashboard?range=30">30 days</Link>{isPro(profile) ? <Link className={days === null ? "font-semibold underline" : "text-muted-foreground"} href="/dashboard?range=all">All time</Link> : billingReady ? <Link className="text-muted-foreground" href="/dashboard?range=all">All time · Pro</Link> : null}</div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Views", metrics.views.toLocaleString()], ["Unique visitors", metrics.visitors.toLocaleString()], ["Clicks", metrics.clicks.toLocaleString()], ["CTR", `${metrics.ctr.toFixed(1)}%`]].map(([label, value]) => <div key={label} className="panel"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}</div>{lockedAll && billingReady && <div className="panel mt-4"><p className="mb-3 text-sm">Showing last 30 days. Full history is a Pro feature.</p><BillingControls pro={false} customer={!!profile.paddleCustomerId}/></div>}</section>
    <section className="mt-12"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Links <span className="text-sm font-normal text-muted-foreground">({links.length}{!isPro(profile) ? "/15" : ""})</span></h2>{(pro || links.length < 15) && <LinkEditor/>}</div>
      <div className="space-y-3">{links.map((link, i) => <div className="panel flex flex-wrap items-center gap-4" key={link.id}><div className="min-w-0 flex-1"><p className="font-medium">{link.title} {!link.enabled && <span className="ml-2 text-xs text-muted-foreground">Inactive</span>}</p><p className="truncate text-sm text-muted-foreground">{link.url}</p></div><p className="text-sm text-muted-foreground">{metrics.perLink.get(link.id) ?? 0} clicks</p><div className="flex items-center gap-1"><form action={moveLink}><input type="hidden" name="id" value={link.id}/><button aria-label={`Move ${link.title} up`} name="direction" value="up" disabled={i === 0} className="button-plain p-2 disabled:opacity-30"><ChevronUp size={16}/></button><button aria-label={`Move ${link.title} down`} name="direction" value="down" disabled={i === links.length - 1} className="button-plain p-2 disabled:opacity-30"><ChevronDown size={16}/></button></form><LinkEditor link={{ id: link.id, title: link.title, description: link.description, url: link.url, enabled: link.enabled }}/><DeleteLinkConfirmation id={link.id} title={link.title}/></div></div>)}</div>
      {links.length >= 15 && !pro && <p className="mt-5 text-sm text-muted-foreground">Free pages support up to 15 links.</p>}
    </section></main>;
}
