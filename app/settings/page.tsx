import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { saveDomain } from "@/app/actions";
import { imageUrl } from "@/lib/image-url";
import { currentProfile } from "@/lib/session";
import { socialPlatforms, themes } from "@/lib/core";
import { ProfileForm } from "@/components/profile-form";

export default async function Settings() {
  const profile = await currentProfile();
  const socials = profile.socials && typeof profile.socials === "object" && !Array.isArray(profile.socials) ? profile.socials as Record<string, string> : {};

  return <main className="mx-auto max-w-2xl px-5 pb-20">
    
    <header className="flex items-center justify-between border-b border-border py-6"><Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-full pr-3 font-semibold hover:underline"><ArrowLeft className="size-4" aria-hidden="true"/>Dashboard</Link><span className="text-sm text-muted-foreground">Settings</span></header>
    <h1 className="mt-10 text-3xl font-semibold">Profile settings</h1><p className="mt-2 text-muted-foreground">Changes appear on <a href={`/${profile.username}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">your public page</a> as soon as you save.</p>
    <div className="mt-7"><ProfileForm profile={{ displayName: profile.displayName, username: profile.username, bio: profile.bio, theme: profile.theme, avatarUrl: profile.avatarPath ? imageUrl(profile.avatarPath) : undefined, socials }} availableThemes={themes} platforms={socialPlatforms}/></div>
    <section className="panel mt-6"><h2 className="font-semibold">Custom domain</h2><p className="mt-1 mb-4 text-sm text-muted-foreground">Serve your page from your own domain. Point DNS and TLS at your deployment first, then enter it here. Leave empty to remove.</p><ActionForm action={saveDomain}><label className="label" htmlFor="domain">Domain</label><input id="domain" className="input" name="domain" type="text" inputMode="url" autoCapitalize="none" autoComplete="off" spellCheck={false} defaultValue={profile.customDomain ?? ""} placeholder="links.example.com"/></ActionForm></section>
  </main>;
}
