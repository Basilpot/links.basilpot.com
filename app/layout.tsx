import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import "./globals.css";
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), title: "LINKS by Basilpot — one link for everything", description: "A simple page for your links, with useful analytics." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${montserrat.variable} ${manrope.variable}`}><body className="min-h-screen">{children}</body></html>;
}
