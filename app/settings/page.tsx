import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { ImagePicker } from "@/components/image-picker";
import { SocialIcon } from "@/components/social-icons";
import { Input } from "@/components/ui/input";
import { saveDomain, saveProfile } from "@/app/actions";
import { imageUrl } from "@/lib/avatar-storage";
import { currentProfile } from "@/lib/session";
import { isPro, socialPlatforms, themes } from "@/lib/core";
import { BillingControls } from "@/components/billing-controls";

export default async function Settings() {
  const profile = await currentProfile();
  const pro = isPro(profile);
  const billingReady = !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && !!process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
  const socials = profile.socials && typeof profile.socials === "object" && !Array.isArray(profile.socials) ? profile.socials as Record<string, string> : {};

  return <main className="mx-auto max-w-2xl px-5 pb-20">
    <header className="flex items-center justify-between border-b border-border py-6"><Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold"><ArrowLeft className="size-4" aria-hidden="true"/>Dashboard</Link><span className="text-sm text-muted-foreground">Settings</span></header>
    <h1 className="mt-10 text-3xl font-semibold">Profile settings</h1>
    <div className="mt-7"><ActionForm action={saveProfile} submit="Save profile">
      <ImagePicker id="avatar" name="avatar" label="Profile image" existingImageUrl={profile.avatarPath ? imageUrl(profile.avatarPath) : undefined}/>
      <div><label className="label" htmlFor="name">Display name</label><input id="name" name="displayName" className="input" defaultValue={profile.displayName} maxLength={80} required /></div>
      <div><label className="label" htmlFor="username">Username</label><input id="username" name="username" className="input" defaultValue={profile.username} minLength={3} maxLength={30} required /></div>
      <div><label className="label" htmlFor="bio">Bio</label><textarea id="bio" name="bio" className="input min-h-24" defaultValue={profile.bio} maxLength={240}/></div>
      <div><label className="label" htmlFor="theme">Theme</label><select id="theme" name="theme" className="input" defaultValue={profile.theme}>{themes.filter(theme => pro || ["paper", "ink", "sand"].includes(theme)).map(theme => <option value={theme} key={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>)}</select>{!pro && billingReady && <p className="mt-1 text-xs text-muted-foreground">Sage and Lavender with Pro.</p>}</div>
      <fieldset className="space-y-4 border-t border-border pt-5"><legend className="font-semibold">Social accounts</legend>{socialPlatforms.map(platform => <div key={platform}><label className="label capitalize" htmlFor={platform}>{platform}</label><div className="relative"><SocialIcon platform={platform} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/><Input id={platform} name={platform} className="pl-10" defaultValue={socials[platform]?.replace(/^mailto:/, "") ?? ""} placeholder={platform === "email" ? "you@example.com" : "https://"}/></div></div>)}</fieldset>
    </ActionForm></div>
    {(pro || billingReady) && <><section className="panel mt-6"><h2 className="font-semibold">Custom domain</h2>{pro ? <><p className="mt-1 mb-4 text-sm text-muted-foreground">Use your own domain after pointing DNS and TLS to your deployment.</p><ActionForm action={saveDomain}><label className="label" htmlFor="domain">Domain</label><input id="domain" className="input" name="domain" defaultValue={profile.customDomain ?? ""} placeholder="links.example.com"/></ActionForm></> : <><p className="mt-1 mb-4 text-sm text-muted-foreground">Available with Pro.</p><BillingControls pro={false} customer={!!profile.paddleCustomerId}/></>}</section><section className="panel mt-6"><h2 className="font-semibold">Branding</h2><p className="mt-1 mb-4 text-sm text-muted-foreground">{pro ? "Product branding is hidden on your page." : "Upgrade to remove product branding from your page."}</p>{!pro && <BillingControls pro={false} customer={!!profile.paddleCustomerId}/>}</section></>}
  </main>;
}
