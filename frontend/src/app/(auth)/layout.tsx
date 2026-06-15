import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col">
      <header className="flex items-center justify-between px-4 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">{children}</main>
    </div>
  );
}
