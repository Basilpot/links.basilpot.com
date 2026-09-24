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
    <header className="flex items-center justify-between border-b border-border py-6"><Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold"><ArrowLeft className="size-4" aria-hidden="true"/>Dashboard</Link><span className="text-sm text-muted-foreground">Settings</span></header>
    <h1 className="mt-10 text-3xl font-semibold">Profile settings</h1>
    <div className="mt-7"><ProfileForm profile={{ displayName: profile.displayName, username: profile.username, bio: profile.bio, theme: profile.theme, avatarUrl: profile.avatarPath ? imageUrl(profile.avatarPath) : undefined, socials }} availableThemes={themes} platforms={socialPlatforms}/></div>
    <section className="panel mt-6"><h2 className="font-semibold">Custom domain</h2><p className="mt-1 mb-4 text-sm text-muted-foreground">Use your own domain after pointing DNS and TLS to your deployment.</p><ActionForm action={saveDomain}><label className="label" htmlFor="domain">Domain</label><input id="domain" className="input" name="domain" defaultValue={profile.customDomain ?? ""} placeholder="links.example.com"/></ActionForm></section>
  </main>;
}
