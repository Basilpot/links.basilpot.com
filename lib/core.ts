import { createHmac } from "node:crypto";
import { headers } from "next/headers";

export const reserved = new Set(["admin", "login", "signup", "dashboard", "settings", "api", "pricing", "about", "claim", "r", "avatar", "_next", "favicon.ico", "example"]);
export const usernamePattern = /^[a-z0-9][a-z0-9_-]{2,29}$/;
export const themes = ["paper", "ink", "sand", "sage", "lavender"] as const;
export const socialPlatforms = ["instagram", "x", "github", "linkedin", "youtube", "facebook", "tiktok", "website", "email"] as const;
export type SocialPlatform = typeof socialPlatforms[number];

export function validUsername(value: string) {
  return usernamePattern.test(value) && !reserved.has(value);
}

export function validUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !!url.hostname;
  } catch { return false; }
}

export async function visitorHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const ua = h.get("user-agent") ?? "unknown";
  const secret = process.env.ANALYTICS_SECRET;
  if (!secret) throw new Error("ANALYTICS_SECRET is required");
  return createHmac("sha256", secret).update(`${ip}\n${ua}`).digest("hex");
}

export function socialUrl(platform: SocialPlatform, value: string) {
  if (platform === "email") return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
  return validUrl(value) ? value : null;
}
