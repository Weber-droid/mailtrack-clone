import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <img src="/sendbeacon/logo.svg" alt="" className="h-8 w-8" width={32} height={32} />
      {showText && (
        <span className="text-lg font-semibold tracking-tight">
          Send<span className="text-beacon">Beacon</span>
        </span>
      )}
    </Link>
  );
}
