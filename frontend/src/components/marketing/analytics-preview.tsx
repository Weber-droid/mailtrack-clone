import { ProductMockupDashboard } from "@/components/marketing/product-mockup-dashboard";

export function AnalyticsPreview() {
  return (
    <section className="marketing-section border-t">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Analytics that update in real time</h2>
          <p className="mt-4 text-muted-foreground">
            Watch opens and clicks roll in live. Filter bots, export CSV, and drill into per-recipient timelines.
          </p>
        </div>
        <div className="mt-16">
          <ProductMockupDashboard />
        </div>
      </div>
    </section>
  );
}
