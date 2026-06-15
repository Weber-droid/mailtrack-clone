import { Check } from "lucide-react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying SendBeacon on your own inbox.",
    features: ["Unlimited tracked emails", "Gmail extension", "Real-time dashboard", "Bot filtering"],
    cta: "Get started",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "Self-host",
    period: "unlimited",
    description: "Deploy on your server for full control and advanced features.",
    features: ["Self-hosted deployment", "Webhooks & API keys", "Teams & campaigns", "Priority support"],
    cta: "View docs",
    href: "https://github.com",
    highlighted: false,
  },
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="marketing-section border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">Start free. Scale on your own infrastructure when you&apos;re ready.</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.highlighted ? "border-beacon/50 bg-card shadow-lg ring-1 ring-beacon/20" : "bg-card"
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/ {plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-beacon" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className="mt-8 block">
                <Button
                  className={`w-full ${plan.highlighted ? "bg-beacon text-accent-foreground hover:bg-beacon/90" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
