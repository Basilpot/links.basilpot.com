"use server";

import { Prisma } from "@/generated/prisma/client";
import { resolveTxt } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isPro, socialPlatforms, socialUrl, themes, validUrl, validUsername } from "@/lib/core";
import { domainToken } from "@/lib/domain";
import { deleteImage, uploadImage } from "@/lib/avatar-storage";
import { currentProfile, currentUser } from "@/lib/session";
import { signOut } from "@workos-inc/authkit-nextjs";

export async function logout() { await signOut(); }

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
  const file = form.get("avatar");
  let avatar: Uint8Array<ArrayBuffer> | undefined;
  let avatarType: string | undefined;
  if (file instanceof File && file.size) {
    if (file.size > 4 * 1024 * 1024) return invalid("avatar", "Image must be under 4 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = bytes.length > 8 && bytes.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i]);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    avatarType = png ? "image/png" : jpeg ? "image/jpeg" : webp ? "image/webp" : undefined;
    if (!avatarType) return invalid("avatar", "Use PNG, JPEG, or WebP image.");
    avatar = bytes;
  }
  const avatarPath = avatar ? `${profile.id}/${crypto.randomUUID()}.${avatarType === "image/png" ? "png" : avatarType === "image/jpeg" ? "jpg" : "webp"}` : undefined;
  if (avatarPath && avatar && avatarType) {
    try { await uploadImage(avatarPath, avatar, avatarType); }
    catch { return invalid("avatar", "Image upload failed. Try again."); }
  }
  try {
    await db.profile.update({ where: { id: profile.id }, data: { username, displayName, bio, theme, socials, ...(avatarPath ? { avatarPath } : {}) } });
  } catch (error) {
    if (avatarPath) await deleteImage(avatarPath).catch(() => {});
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return invalid("username", "Username already taken.");
    throw error;
  }
  if (avatarPath && profile.avatarPath) await deleteImage(profile.avatarPath).catch(() => {});
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
  const file = form.get("image");
  let image: Uint8Array | undefined;
  let imageType: string | undefined;
  if (file instanceof File && file.size) {
    if (file.size > 4 * 1024 * 1024) return "Image must be under 4 MB.";
    image = new Uint8Array(await file.arrayBuffer());
    const png = image.length > 8 && image.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i]);
    const jpeg = image[0] === 255 && image[1] === 216 && image[2] === 255;
    const webp = new TextDecoder().decode(image.slice(0, 4)) === "RIFF" && new TextDecoder().decode(image.slice(8, 12)) === "WEBP";
    imageType = png ? "image/png" : jpeg ? "image/jpeg" : webp ? "image/webp" : undefined;
    if (!imageType) return "Use PNG, JPEG, or WebP image.";
  }
  const imagePath = image ? `links/${profile.id}/${crypto.randomUUID()}.${imageType === "image/png" ? "png" : imageType === "image/jpeg" ? "jpg" : "webp"}` : undefined;
  const previous = id ? await db.link.findFirst({ where: { id, profileId: profile.id, deletedAt: null }, select: { imagePath: true } }) : null;
  if (id && !previous) return "Link not found.";
  if (imagePath && image && imageType) {
    try { await uploadImage(imagePath, image, imageType); }
    catch { return "Image upload failed. Try again."; }
  }
  try {
    if (id) {
      const result = await db.link.updateMany({ where: { id, profileId: profile.id, deletedAt: null }, data: { title, description, url, enabled, ...(imagePath ? { imagePath } : {}) } });
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
  if (imagePath && previous?.imagePath) await deleteImage(previous.imagePath).catch(() => {});
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
