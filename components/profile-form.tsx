"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileFormState } from "@/app/actions";
import { Submit } from "@/components/action-form";
import { ImagePicker } from "@/components/image-picker";
import { SocialIcon } from "@/components/social-icons";
import { ThemePicker } from "@/components/theme-picker";
import { Input } from "@/components/ui/input";
import type { SocialPlatform } from "@/lib/core";

const initialState: ProfileFormState = { status: "", errors: {} };

function FieldError({ message, id }: { message?: string; id: string }) {
  return message && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-destructive">{message}</p>;
}

export function ProfileForm({ profile, availableThemes, platforms }: {
  profile: { displayName: string; username: string; bio: string; theme: string; avatarUrl?: string; socials: Record<string, string> };
  availableThemes: readonly string[];
  platforms: readonly SocialPlatform[];
}) {
  const [state, action] = useActionState(saveProfile, initialState);
  const { errors } = state;

  return <form action={action} className="space-y-4">
    <ImagePicker id="avatar" name="avatar" label="Profile image" existingImageUrl={profile.avatarUrl} error={errors.avatar} kind="avatar"/>
    <div><label className="label" htmlFor="name">Display name</label><input id="name" name="displayName" className="input" defaultValue={profile.displayName} maxLength={80} required aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? "name-error" : undefined}/><FieldError id="name" message={errors.displayName}/></div>
    <div><label className="label" htmlFor="username">Username</label><input id="username" name="username" autoComplete="off" autoCapitalize="none" spellCheck={false} className="input" defaultValue={profile.username} minLength={3} maxLength={30} required aria-invalid={!!errors.username} aria-describedby={errors.username ? "username-error" : undefined}/><p className="hint">3–30 characters: lowercase letters, numbers, hyphens and underscores.</p><FieldError id="username" message={errors.username}/></div>
    <div><label className="label" htmlFor="bio">Bio</label><textarea id="bio" rows={4} name="bio" className="input min-h-24" defaultValue={profile.bio} maxLength={240} aria-invalid={!!errors.bio} aria-describedby={errors.bio ? "bio-error" : undefined}/><p className="hint">Up to 240 characters.</p><FieldError id="bio" message={errors.bio}/></div>
    <ThemePicker themes={availableThemes} defaultValue={profile.theme} error={errors.theme}/>
    <fieldset className="space-y-4 border-t border-border pt-5"><legend className="font-semibold">Social accounts</legend>{platforms.map(platform => <div key={platform}><label className="label capitalize" htmlFor={platform}>{platform}</label><div className="relative"><SocialIcon platform={platform} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/><Input id={platform} name={platform} className="pl-10" type={platform === "phone" ? "tel" : undefined} defaultValue={profile.socials[platform]?.replace(/^(mailto:|tel:)/, "") ?? ""} placeholder={platform === "email" ? "you@example.com" : platform === "phone" ? "+1 555 010 0100" : "https://"} aria-invalid={!!errors[platform]} aria-describedby={errors[platform] ? `${platform}-error` : undefined}/></div><FieldError id={platform} message={errors[platform]}/></div>)}</fieldset>
    <Submit>Save profile</Submit>
    {state.status && <p role="status" className={`text-sm ${Object.keys(errors).length ? "text-destructive" : "text-muted-foreground"}`}>{state.status}</p>}
  </form>;
}
