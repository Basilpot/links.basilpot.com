import { getSignUpUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
export async function GET() { redirect(await getSignUpUrl()); }
