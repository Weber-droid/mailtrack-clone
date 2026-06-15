"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/marketing/logo";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function AppNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    pathname === href ? "text-foreground font-medium" : "transition-colors hover:text-foreground";

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Logo />
          {user && (
            <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Link href="/campaign" className={linkClass("/campaign")}>
                Campaign
              </Link>
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link href="/campaigns" className={linkClass("/campaigns")}>
                Campaigns
              </Link>
              <Link href="/settings" className={linkClass("/settings")}>
                Settings
              </Link>
              {user.is_admin && (
                <Link href="/admin" className={linkClass("/admin")}>
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
