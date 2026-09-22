"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileFormState } from "@/app/actions";
import { Submit } from "@/components/action-form";
import { ImagePicker } from "@/components/image-picker";
import { SocialIcon } from "@/components/social-icons";
import { Input } from "@/components/ui/input";
import type { SocialPlatform } from "@/lib/core";

const initialState: ProfileFormState = { status: "", errors: {} };

function FieldError({ message, id }: { message?: string; id: string }) {
  return message && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-destructive">{message}</p>;
}

export function ProfileForm({ profile, billingReady, availableThemes, platforms }: {
  profile: { displayName: string; username: string; bio: string; theme: string; avatarUrl?: string; socials: Record<string, string> };
  billingReady: boolean;
  availableThemes: string[];
  platforms: readonly SocialPlatform[];
}) {
  const [state, action] = useActionState(saveProfile, initialState);
  const { errors } = state;

  return <form action={action} className="space-y-4">
    <ImagePicker id="avatar" name="avatar" label="Profile image" existingImageUrl={profile.avatarUrl} error={errors.avatar}/>
    <div><label className="label" htmlFor="name">Display name</label><input id="name" name="displayName" className="input" defaultValue={profile.displayName} maxLength={80} required aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? "name-error" : undefined}/><FieldError id="name" message={errors.displayName}/></div>
    <div><label className="label" htmlFor="username">Username</label><input id="username" name="username" className="input" defaultValue={profile.username} minLength={3} maxLength={30} required aria-invalid={!!errors.username} aria-describedby={errors.username ? "username-error" : undefined}/><FieldError id="username" message={errors.username}/></div>
    <div><label className="label" htmlFor="bio">Bio</label><textarea id="bio" name="bio" className="input min-h-24" defaultValue={profile.bio} maxLength={240} aria-invalid={!!errors.bio} aria-describedby={errors.bio ? "bio-error" : undefined}/><FieldError id="bio" message={errors.bio}/></div>
    <div><label className="label" htmlFor="theme">Theme</label><select id="theme" name="theme" className="input" defaultValue={profile.theme} aria-invalid={!!errors.theme} aria-describedby={errors.theme ? "theme-error" : undefined}>{availableThemes.map(theme => <option value={theme} key={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>)}</select><FieldError id="theme" message={errors.theme}/>{availableThemes.length === 3 && billingReady && <p className="mt-1 text-xs text-muted-foreground">Sage and Lavender with Pro.</p>}</div>
    <fieldset className="space-y-4 border-t border-border pt-5"><legend className="font-semibold">Social accounts</legend>{platforms.map(platform => <div key={platform}><label className="label capitalize" htmlFor={platform}>{platform}</label><div className="relative"><SocialIcon platform={platform} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/><Input id={platform} name={platform} className="pl-10" defaultValue={profile.socials[platform]?.replace(/^mailto:/, "") ?? ""} placeholder={platform === "email" ? "you@example.com" : "https://"} aria-invalid={!!errors[platform]} aria-describedby={errors[platform] ? `${platform}-error` : undefined}/></div><FieldError id={platform} message={errors[platform]}/></div>)}</fieldset>
    <Submit>Save profile</Submit>
    {state.status && <p role="status" className="text-sm text-muted-foreground">{state.status}</p>}
  </form>;
}
