import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CTABanner() {
  return (
    <section className="marketing-section border-t">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground md:px-16">
          <div className="absolute inset-0 bg-gradient-to-br from-beacon/20 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start tracking emails today</h2>
            <p className="mx-auto mt-4 max-w-xl opacity-90">
              Join teams who know exactly when prospects engage. Free to use, unlimited tracking.
            </p>
            <Link href="/register" className="mt-8 inline-block">
              <Button size="lg" className="gap-2 bg-beacon text-accent-foreground hover:bg-beacon/90">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
