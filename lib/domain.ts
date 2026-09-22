import { createHmac } from "node:crypto";
export function domainToken(profileId: string, domain: string) {
  const secret = process.env.APP_SIGNING_SECRET;
  if (!secret) throw new Error("APP_SIGNING_SECRET is required");
  return createHmac("sha256", secret).update(`${profileId}:${domain}`).digest("hex");
}
