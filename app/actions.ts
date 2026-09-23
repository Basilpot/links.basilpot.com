"use server";

import { Prisma } from "@/generated/prisma/client";
import { resolveTxt } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isPro, socialPlatforms, socialUrl, themes, validUrl, validUsername } from "@/lib/core";
import { domainToken } from "@/lib/domain";
import { deleteImage, uploadUrl } from "@/lib/avatar-storage";
import { currentProfile, currentUser } from "@/lib/session";
import { signOut } from "@workos-inc/authkit-nextjs";

export async function logout() { await signOut(); }

const imageTypes = ["image/png", "image/jpeg", "image/webp"] as const;
export type ImageType = typeof imageTypes[number];

export async function createUpload(kind: "link" | "avatar", type: ImageType): Promise<{ url: string; path: string } | { error: string }> {
  const profile = await currentProfile();
  if (!imageTypes.includes(type)) return { error: "Use PNG, JPEG, or WebP image." };
  const ext = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
  const path = kind === "link" ? `links/${profile.id}/${crypto.randomUUID()}.${ext}` : `${profile.id}/${crypto.randomUUID()}.${ext}`;
  return { url: await uploadUrl(path, type), path };
}

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

export type ProfileFormState = { status: string; errors: Record<string, string> };

export async function saveProfile(_: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const invalid = (field: string, message: string): ProfileFormState => ({ status: "", errors: { [field]: message } });
  const profile = await currentProfile();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const theme = String(form.get("theme") ?? "paper");
  if (!validUsername(username)) return invalid("username", "Invalid or reserved username.");
  if (!displayName || displayName.length > 80) return invalid("displayName", "Name required (max 80 characters).");
  if (bio.length > 240) return invalid("bio", "Bio max 240 characters.");
  if (!themes.includes(theme as typeof themes[number])) return invalid("theme", "Invalid theme.");
  if (!isPro(profile) && !["paper", "ink", "sand"].includes(theme)) return invalid("theme", "Upgrade to Pro for this theme.");
  const socials: Record<string, string> = {};
  for (const platform of socialPlatforms) {
    const raw = String(form.get(platform) ?? "").trim();
    if (!raw) continue;
    const value = platform === "email" && !raw.startsWith("mailto:") ? `mailto:${raw}` : raw;
    if (!socialUrl(platform, value)) return invalid(platform, `Invalid ${platform} URL.`);
    socials[platform] = value;
  }
  const removeAvatar = form.get("removeImage") === "on";
  const avatarPath = String(form.get("imagePath") ?? "").trim();
  if (avatarPath && !avatarPath.startsWith(`${profile.id}/`)) return invalid("avatar", "Invalid image.");
  try {
    await db.profile.update({ where: { id: profile.id }, data: { username, displayName, bio, theme, socials, ...(avatarPath ? { avatarPath } : removeAvatar ? { avatarPath: null } : {}) } });
  } catch (error) {
    if (avatarPath) await deleteImage(avatarPath).catch(() => {});
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return invalid("username", "Username already taken.");
    throw error;
  }
  if (profile.avatarPath && (avatarPath || removeAvatar)) await deleteImage(profile.avatarPath).catch(() => {});
  revalidatePath(`/${profile.username}`);
  revalidatePath(`/${username}`);
  revalidatePath("/dashboard");
  return { status: "Saved.", errors: {} };
}

export async function saveLink(_: string, form: FormData): Promise<string> {
  const profile = await currentProfile();
  const id = String(form.get("id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const enabled = form.get("enabled") === "on";
  if (!title || title.length > 100 || !validUrl(url) || url.length > 2048) return "Title max 100 characters; URL must start with https:// or http://.";
  if (description.length > 240) return "Description max 240 characters.";
  const removeImage = form.get("removeImage") === "on";
  const imagePath = String(form.get("imagePath") ?? "").trim();
  if (imagePath && !imagePath.startsWith(`links/${profile.id}/`)) return "Invalid image.";
  const previous = id ? await db.link.findFirst({ where: { id, profileId: profile.id, deletedAt: null }, select: { imagePath: true } }) : null;
  if (id && !previous) return "Link not found.";
  try {
    if (id) {
      const data: { title: string; description: string; url: string; enabled: boolean; imagePath?: string | null } = { title, description, url, enabled };
      if (imagePath) data.imagePath = imagePath;
      else if (removeImage) data.imagePath = null;
      const result = await db.link.updateMany({ where: { id, profileId: profile.id, deletedAt: null }, data });
      if (!result.count) throw new Error("Link not found.");
    } else {
      await db.$transaction(async tx => {
        const count = await tx.link.count({ where: { profileId: profile.id, deletedAt: null } });
        if (!isPro(profile) && count >= 15) throw new Error("LIMIT");
        const last = await tx.link.findFirst({ where: { profileId: profile.id, deletedAt: null }, orderBy: { position: "desc" } });
        await tx.link.create({ data: { profileId: profile.id, title, description, url, enabled, imagePath, position: (last?.position ?? -1) + 1 } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }
  } catch (error) {
    if (imagePath) await deleteImage(imagePath).catch(() => {});
    if (error instanceof Error && error.message === "LIMIT") return "Free plan allows 15 links.";
    if (error instanceof Error && error.message === "Link not found.") return error.message;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return "Links changed. Try again.";
    throw error;
  }
  if (previous?.imagePath && (imagePath || removeImage)) await deleteImage(previous.imagePath).catch(() => {});
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.username}`);
  return "Saved.";
}

export async function deleteLink(form: FormData) {
  const profile = await currentProfile();
  const id = String(form.get("id") ?? "");
  const link = await db.link.findFirst({ where: { id, profileId: profile.id, deletedAt: null }, select: { imagePath: true } });
  await db.link.updateMany({ where: { id, profileId: profile.id, deletedAt: null }, data: { deletedAt: new Date(), enabled: false } });
  if (link?.imagePath) await deleteImage(link.imagePath).catch(() => {});
  revalidatePath("/dashboard"); revalidatePath(`/${profile.username}`);
}

export async function reorderLinks(ids: string[]) {
  const profile = await currentProfile();
  const links = await db.link.findMany({ where: { profileId: profile.id, deletedAt: null }, select: { id: true } });
  const valid = new Set(links.map(link => link.id));
  if (ids.length !== links.length || new Set(ids).size !== ids.length || ids.some(id => !valid.has(id))) return;
  await db.$transaction(ids.map((id, position) => db.link.update({ where: { id }, data: { position } })));
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
