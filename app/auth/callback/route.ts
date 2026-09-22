import { handleAuth } from "@workos-inc/authkit-nextjs";
import { provisionUser } from "@/lib/identity";

export const GET = handleAuth({
  returnPathname: "/dashboard",
  onSuccess: async ({ user }) => { await provisionUser(user); },
});
