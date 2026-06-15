import Link from "next/link";
import { ArrowRight, Globe, Shield, Zap } from "lucide-react";

import { ProductMockupDashboard } from "@/components/marketing/product-mockup-dashboard";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      <div className="grid-pattern absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <Zap className="h-4 w-4 text-beacon" />
            Self-hosted email tracking for teams
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Know when your emails{" "}
            <span className="bg-gradient-to-r from-beacon to-beacon-glow bg-clip-text text-transparent">
              get opened
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            SendBeacon tracks opens, clicks, and engagement in real time. Use our Gmail extension or embed
            tracking in any email — you own the data.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2 bg-beacon text-accent-foreground hover:bg-beacon/90">
                Start free — unlimited tracking
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> Chrome extension
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Self-hosted
            </span>
            <span>No credit card required</span>
          </div>
        </div>
        <div className="mt-16">
          <ProductMockupDashboard />
        </div>
      </div>
    </section>
  );
}
