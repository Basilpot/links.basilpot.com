import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { claim } from "@/app/actions";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
export default async function Claim() { const userId = await currentUser(); if (await db.profile.findUnique({ where: { userId } })) redirect("/dashboard"); return <main className="mx-auto max-w-md px-6 py-20"><h1 className="mb-3 text-3xl font-semibold">Choose username</h1><p className="mb-8 text-muted-foreground">Your public page lives at /yourname.</p><ActionForm action={claim} submit="Claim username"><label className="label" htmlFor="username">Username</label><input className="input" id="username" name="username" minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9_-]{2,29}" required autoComplete="username" /></ActionForm></main>; }
