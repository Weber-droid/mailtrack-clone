export function ProductMockupDashboard() {
  return (
    <div className="beacon-glow relative mx-auto max-w-4xl overflow-hidden rounded-xl border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-400/80" />
        <div className="h-3 w-3 rounded-full bg-amber-400/80" />
        <div className="h-3 w-3 rounded-full bg-green-400/80" />
        <span className="ml-2 text-xs text-muted-foreground">app.sendbeacon.io/dashboard</span>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        {[
          { label: "Emails sent", value: "248", sub: "This month" },
          { label: "Open rate", value: "67.4%", sub: "Adjusted 61.2%" },
          { label: "Click rate", value: "23.1%", sub: "Link CTR" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>
      <div className="border-t px-6 pb-6">
        <p className="mb-3 text-sm font-medium">Live activity</p>
        <div className="space-y-2">
          {[
            { who: "sarah@company.com", event: "Open", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
            { who: "john@startup.io", event: "Click", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
            { who: "alex@agency.co", event: "Open", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
          ].map((row) => (
            <div
              key={row.who}
              className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
            >
              <span>{row.who}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.color}`}>{row.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
