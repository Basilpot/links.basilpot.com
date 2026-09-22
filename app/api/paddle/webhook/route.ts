import { EventName, type EventEntity } from "@paddle/paddle-node-sdk";
import { db } from "@/lib/db";
import { paddle, paddleProfile } from "@/lib/paddle";

async function syncSubscription(event: EventEntity) {
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionTrialing:
    case EventName.SubscriptionPastDue:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed:
    case EventName.SubscriptionCanceled: {
      const sub = event.data;
      const profile = await paddleProfile(sub.id, sub.customData);
      if (!profile) throw new Error(`No profile for subscription ${sub.id}`);
      const occurredAt = new Date(event.occurredAt);
      if (profile.subscriptionEventAt && occurredAt <= profile.subscriptionEventAt) return;
      const priceId = sub.items?.find(item => item.price?.id === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID)?.price?.id ?? null;
      await db.profile.update({ where: { id: profile.id }, data: {
        paddleCustomerId: sub.customerId,
        paddleSubscriptionId: sub.id,
        paddlePriceId: priceId,
        subscriptionStatus: sub.status,
        currentPeriodEnd: sub.currentBillingPeriod?.endsAt ? new Date(sub.currentBillingPeriod.endsAt) : null,
        subscriptionEventAt: occurredAt,
      } });
      return;
    }
    default: return;
  }
}
export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;
  const body = await request.text();
  if (!signature || !secret || !body) return new Response("Webhook not configured or malformed", { status: 400 });
  try {
    const event = await paddle().webhooks.unmarshal(body, secret, signature);
    if (event) await syncSubscription(event);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook failed", error);
    return new Response("Webhook failed", { status: 500 });
  }
}
