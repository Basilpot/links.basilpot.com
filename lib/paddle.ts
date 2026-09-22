import { createHmac, timingSafeEqual } from "node:crypto";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { db } from "@/lib/db";

export function paddle() {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is required");
  return new Paddle(key, { environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? Environment.production : Environment.sandbox });
}
export function checkoutSignature(profileId: string) {
  const secret = process.env.APP_SIGNING_SECRET;
  if (!secret) throw new Error("APP_SIGNING_SECRET is required");
  return createHmac("sha256", secret).update(profileId).digest("hex");
}
export function verifiedProfileId(data: Record<string, unknown> | null) {
  const id = data?.profileId;
  const signature = data?.signature;
  if (typeof id !== "string" || typeof signature !== "string" || !/^[a-f0-9]{64}$/.test(signature)) return null;
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(checkoutSignature(id), "hex")) ? id : null;
}
export async function paddleProfile(subscriptionId: string, customData: Record<string, unknown> | null) {
  const bySubscription = await db.profile.findUnique({ where: { paddleSubscriptionId: subscriptionId } });
  if (bySubscription) return bySubscription;
  const id = verifiedProfileId(customData);
  return id ? db.profile.findUnique({ where: { id } }) : null;
}
