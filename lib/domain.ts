import { createHmac } from "node:crypto";
export function domainToken(profileId: string, domain: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return createHmac("sha256", secret).update(`${profileId}:${domain}`).digest("hex");
}
