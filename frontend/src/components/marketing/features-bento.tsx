import { BarChart3, Bell, Globe, Link2, MousePointerClick, Shield, Users, Webhook } from "lucide-react";

const features = [
  {
    icon: MousePointerClick,
    title: "Open & click tracking",
    description: "Invisible pixel tracking and link rewriting with per-link analytics.",
    className: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Real-time dashboard",
    description: "Live feed, open rates, bot filtering, and CSV export.",
    className: "",
  },
  {
    icon: Globe,
    title: "Gmail extension",
    description: "One-click tracking toggles inside Gmail compose. Works on Chrome, Brave, Edge.",
    className: "",
  },
  {
    icon: Webhook,
    title: "Webhooks & API",
    description: "HMAC-signed webhooks and API keys for your stack.",
    className: "",
  },
  {
    icon: Users,
    title: "Teams & campaigns",
    description: "Organize sends by campaign, share templates, invite teammates.",
    className: "",
  },
  {
    icon: Shield,
    title: "Self-hosted & private",
    description: "Your data stays on your infrastructure. Full account export anytime.",
    className: "md:col-span-2",
  },
  {
    icon: Bell,
    title: "Instant notifications",
    description: "Desktop alerts when prospects open or click your emails.",
    className: "",
  },
  {
    icon: Link2,
    title: "Link-level CTR",
    description: "See which links drive engagement, not just opens.",
    className: "",
  },
];

export function FeaturesBento() {
  return (
    <section id="features" className="marketing-section border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to track outreach</h2>
          <p className="mt-4 text-muted-foreground">
            From solo founders to sales teams — opens, clicks, webhooks, and Gmail integration in one platform.
          </p>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg ${feature.className}`}
            >
              <feature.icon className="h-8 w-8 text-beacon" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
