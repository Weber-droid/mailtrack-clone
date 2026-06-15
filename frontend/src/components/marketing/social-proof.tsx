export function SocialProof() {
  const stats = [
    { value: "67%", label: "avg. open rate insight" },
    { value: "<1s", label: "event latency" },
    { value: "100%", label: "data ownership" },
  ];

  return (
    <section className="border-y bg-card py-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-12 px-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-bold text-beacon">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
