import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}
export async function currentProfile() {
  const userId = await currentUser();
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) redirect("/claim");
  return profile;
}
