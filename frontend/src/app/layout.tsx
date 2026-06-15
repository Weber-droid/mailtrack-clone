import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

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
  title: "Mailtrack Clone",
  description: "Self-hosted email tracking and analytics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-full flex-col">
            <header className="border-b">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
                <div className="flex items-center gap-6">
                  <Link href="/" className="text-lg font-semibold tracking-tight">
                    Mailtrack Clone
                  </Link>
                  <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/" className="transition-colors hover:text-foreground">
                      Campaign
                    </Link>
                    <Link href="/dashboard" className="transition-colors hover:text-foreground">
                      Dashboard
                    </Link>
                  </nav>
                </div>
                <ThemeToggle />
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          </div>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
