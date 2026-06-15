import { ProductMockupGmail } from "@/components/marketing/product-mockup-gmail";

const steps = [
  {
    step: "01",
    title: "Sign up & install",
    description: "Create a free account and load the SendBeacon extension in Chrome or Brave.",
  },
  {
    step: "02",
    title: "Compose in Gmail",
    description: "Toggle track opens and track links before you hit send — no copy-paste required.",
  },
  {
    step: "03",
    title: "Watch engagement live",
    description: "Opens and clicks appear on your dashboard in seconds. Export or webhook to your CRM.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="marketing-section">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How SendBeacon works</h2>
            <p className="mt-4 text-muted-foreground">
              Three steps from signup to knowing exactly when your prospect read your email.
            </p>
            <div className="mt-10 space-y-8">
              {steps.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-beacon/15 text-sm font-bold text-beacon">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ProductMockupGmail />
        </div>
      </div>
    </section>
  );
}
