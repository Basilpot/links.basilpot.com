import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { db } from "@/lib/db";

export async function currentUser() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const local = await db.user.findUnique({ where: { workosId: user.id }, select: { id: true } });
  if (!local) throw new Error("WorkOS account was not provisioned");
  return local.id;
}
export async function currentProfile() {
  const userId = await currentUser();
  const profile = await db.profile.findUnique({ where: { userId } });
  if (!profile) redirect("/claim");
  return profile;
}
