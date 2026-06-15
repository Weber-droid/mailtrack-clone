"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <div className="flex min-h-full flex-col">{children}</div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppShell>{children}</AppShell>
      </GoogleOAuthProvider>
    );
  }
  return <AppShell>{children}</AppShell>;
}
