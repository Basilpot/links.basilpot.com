import type { Metadata } from "next";
import { Bricolage_Grotesque, Livvic } from "next/font/google";
import "./globals.css";
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const livvic = Livvic({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-livvic", display: "swap" });
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), title: "LINKS by Basilpot — one link for everything", description: "A simple page for your links, with useful analytics." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${bricolage.variable} ${livvic.variable}`}><body className="min-h-screen">{children}</body></html>;
}
