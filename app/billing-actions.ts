"use server";
import { currentProfile } from "@/lib/session";
import { db } from "@/lib/db";
import { checkoutSignature, paddle } from "@/lib/paddle";
import { isPro } from "@/lib/core";

export async function checkoutData() {
  const profile = await currentProfile();
  if (isPro(profile)) throw new Error("Already subscribed");
  const user = await db.user.findUniqueOrThrow({ where: { id: profile.userId }, select: { email: true } });
  return { email: user.email, profileId: profile.id, signature: checkoutSignature(profile.id) };
}
export async function portalUrl() {
  const profile = await currentProfile();
  if (!profile.paddleCustomerId) throw new Error("No billing account yet");
  const session = await paddle().customerPortalSessions.create(profile.paddleCustomerId, profile.paddleSubscriptionId ? [profile.paddleSubscriptionId] : []);
  return session.urls.general.overview;
}
