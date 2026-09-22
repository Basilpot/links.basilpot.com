import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
const geist = Geist({ subsets: ["latin"] });
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), title: "Linkbio — one link for everything", description: "A simple page for your links, with useful analytics." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${geist.className} min-h-screen`}>{children}</body></html>;
}
