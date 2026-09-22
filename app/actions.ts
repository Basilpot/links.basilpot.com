"use server";

import { Prisma } from "@/generated/prisma/client";
import { resolveTxt } from "node:dns/promises";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isPro, socialPlatforms, socialUrl, themes, validUrl, validUsername } from "@/lib/core";
import { domainToken } from "@/lib/domain";
import { hashPassword } from "@/lib/password";
import { currentProfile, currentUser } from "@/lib/session";
import { signIn, signOut } from "@/auth";

export async function signup(_: string, form: FormData): Promise<string> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) return "Enter valid email and password of at least 10 characters.";
  try { await db.user.create({ data: { email, passwordHash: await hashPassword(password) } }); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "Email already in use."; throw error; }
  await signIn("credentials", { email, password, redirectTo: "/claim" });
  return "";
}

export async function login(_: string, form: FormData): Promise<string> {
  try {
    await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return "Invalid email or password.";
    throw error;
  }
  return "";
}

export async function logout() { await signOut({ redirectTo: "/" }); }

export async function claim(_: string, form: FormData): Promise<string> {
  const userId = await currentUser();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  if (!validUsername(username)) return "Use 3–30 lowercase letters, numbers, underscores, or hyphens. This name may be reserved.";
  try {
    await db.profile.create({ data: { userId, username, displayName: username } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "Username already taken.";
    throw error;
  }
  redirect("/dashboard");
}

export async function saveProfile(_: string, form: FormData): Promise<string> {
  const profile = await currentProfile();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const theme = String(form.get("theme") ?? "paper");
  if (!validUsername(username)) return "Invalid or reserved username.";
  if (!displayName || displayName.length > 80 || bio.length > 240) return "Name required (max 80). Bio max 240 characters.";
  if (!themes.includes(theme as typeof themes[number])) return "Invalid theme.";
  if (!isPro(profile) && !["paper", "ink", "sand"].includes(theme)) return "Upgrade to Pro for this theme.";
  const socials: Record<string, string> = {};
  for (const platform of socialPlatforms) {
    const raw = String(form.get(platform) ?? "").trim();
    if (!raw) continue;
    const value = platform === "email" && !raw.startsWith("mailto:") ? `mailto:${raw}` : raw;
    if (!socialUrl(platform, value)) return `Invalid ${platform} URL.`;
    socials[platform] = value;
  }
  const file = form.get("avatar");
  let avatar: Uint8Array<ArrayBuffer> | undefined;
  let avatarType: string | undefined;
  if (file instanceof File && file.size) {
    if (file.size > 1024 * 1024) return "Image must be under 1 MB.";
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = bytes.length > 8 && bytes.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i]);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    avatarType = png ? "image/png" : jpeg ? "image/jpeg" : webp ? "image/webp" : undefined;
    if (!avatarType) return "Use PNG, JPEG, or WebP image.";
    avatar = bytes;
  }
  try {
    await db.profile.update({ where: { id: profile.id }, data: { username, displayName, bio, theme, socials, ...(avatar ? { avatar, avatarType } : {}) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "Username already taken.";
    throw error;
  }
  revalidatePath(`/${profile.username}`);
  revalidatePath(`/${username}`);
  revalidatePath("/dashboard");
  return "Saved.";
}

export async function saveLink(_: string, form: FormData): Promise<string> {
  const profile = await currentProfile();
  const id = String(form.get("id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const enabled = form.get("enabled") === "on";
  if (!title || title.length > 100 || !validUrl(url) || url.length > 2048) return "Title max 100 characters; URL must start with https:// or http://.";
  if (id) {
    const result = await db.link.updateMany({ where: { id, profileId: profile.id, deletedAt: null }, data: { title, url, enabled } });
    if (!result.count) return "Link not found.";
  } else {
    try {
      await db.$transaction(async tx => {
        const count = await tx.link.count({ where: { profileId: profile.id, deletedAt: null } });
        if (!isPro(profile) && count >= 15) throw new Error("LIMIT");
        const last = await tx.link.findFirst({ where: { profileId: profile.id, deletedAt: null }, orderBy: { position: "desc" } });
        await tx.link.create({ data: { profileId: profile.id, title, url, enabled, position: (last?.position ?? -1) + 1 } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) { if (error instanceof Error && error.message === "LIMIT") return "Free plan allows 15 links. Upgrade to Pro for unlimited links."; if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return "Links changed. Try again."; throw error; }
  }
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.username}`);
  return "Saved.";
}

export async function deleteLink(form: FormData) {
  const profile = await currentProfile();
  await db.link.updateMany({ where: { id: String(form.get("id") ?? ""), profileId: profile.id, deletedAt: null }, data: { deletedAt: new Date(), enabled: false } });
  revalidatePath("/dashboard"); revalidatePath(`/${profile.username}`);
}

export async function moveLink(form: FormData) {
  const profile = await currentProfile();
  const links = await db.link.findMany({ where: { profileId: profile.id, deletedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const index = links.findIndex(link => link.id === form.get("id"));
  const next = index + (form.get("direction") === "up" ? -1 : 1);
  if (index < 0 || next < 0 || next >= links.length) return;
  await db.$transaction([
    db.link.update({ where: { id: links[index].id }, data: { position: links[next].position } }),
    db.link.update({ where: { id: links[next].id }, data: { position: links[index].position } }),
  ]);
  revalidatePath("/dashboard"); revalidatePath(`/${profile.username}`);
}

export async function saveDomain(_: string, form: FormData): Promise<string> {
  const profile = await currentProfile();
  if (!isPro(profile)) return "Upgrade to Pro to use a custom domain.";
  const customDomain = String(form.get("domain") ?? "").trim().toLowerCase() || null;
  if (customDomain && (!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(customDomain))) return "Enter a valid domain.";
  if (customDomain) {
    const token = domainToken(profile.id, customDomain);
    const records = await resolveTxt(`_linkbio.${customDomain}`).catch(() => []);
    if (!records.some(parts => parts.join("") === token)) return `Add TXT record _linkbio.${customDomain} with value ${token}, then retry.`;
  }
  try { await db.profile.update({ where: { id: profile.id }, data: { customDomain } }); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "Domain already in use."; throw error; }
  return "Saved. Point domain to this deployment and configure TLS with your host.";
}
