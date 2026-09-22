import { PublicProfile } from "@/components/public-profile";
import type { Profile, Link } from "@/generated/prisma/client";
const now = new Date();
const profile = { id: "example", username: "example", displayName: "Alex Morgan", bio: "Designer and maker. A few things worth sharing.", theme: "paper", socials: { github: "https://github.com", instagram: "https://instagram.com" }, avatar: null, avatarType: null, subscriptionStatus: null, paddlePriceId: null, updatedAt: now, links: [{ id: "portfolio", title: "Portfolio", url: "https://example.com" }, { id: "writing", title: "Writing", url: "https://example.com" }, { id: "project", title: "Latest project", url: "https://example.com" }] } as unknown as Profile & { links: Link[] };
export default function Example() { return <PublicProfile profile={profile} example/>; }
