import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SendBeacon — Email tracking that you own",
    template: "%s | SendBeacon",
  },
  description:
    "Self-hosted email open and click tracking with Gmail extension, real-time dashboard, webhooks, and teams.",
  openGraph: {
    title: "SendBeacon — Email tracking that you own",
    description: "Know when your emails get opened. Self-hosted, private, with a free Gmail extension.",
    images: ["/sendbeacon/og-image.svg"],
  },
  icons: {
    icon: "/sendbeacon/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
