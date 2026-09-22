import { authkitProxy } from "@workos-inc/authkit-nextjs";
export default authkitProxy({ middlewareAuth: { enabled: true, unauthenticatedPaths: [] } });
export const config = { matcher: ["/dashboard/:path*", "/settings/:path*", "/claim/:path*"] };
