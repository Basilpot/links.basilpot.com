"use client";
import { useState } from "react";
import { initializePaddle } from "@paddle/paddle-js";
import { checkoutData, portalUrl } from "@/app/billing-actions";

export function BillingControls({ pro, customer }: { pro: boolean; customer: boolean }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function upgrade() {
    setPending(true); setMessage("");
    try {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
      if (!token || !priceId) throw new Error("Checkout is not configured yet.");
      const data = await checkoutData();
      const paddle = await initializePaddle({ token, environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox" });
      if (!paddle) throw new Error("Checkout could not load.");
      paddle.Checkout.open({ items: [{ priceId, quantity: 1 }], customer: { email: data.email }, customData: { profileId: data.profileId, signature: data.signature } });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Checkout unavailable."); }
    finally { setPending(false); }
  }
  async function manage() {
    setPending(true); setMessage("");
    try { window.location.href = await portalUrl(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Billing portal unavailable."); setPending(false); }
  }
  return <div className="flex flex-wrap items-center gap-3">{!pro && <button className="button" disabled={pending} onClick={upgrade}>{pending ? "Opening…" : "Upgrade to Pro"}</button>}{customer && <button className="button-plain" disabled={pending} onClick={manage}>Manage billing</button>}{message && <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>}</div>;
}
