"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ActivityFeed } from "@/components/activity-feed";
import { MetricCards } from "@/components/metric-cards";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { exportAnalyticsCsv, fetchAnalytics, type AnalyticsResponse } from "@/lib/analytics";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [excludeBots, setExcludeBots] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await fetchAnalytics(excludeBots);
      setAnalytics(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [excludeBots]);

  useEffect(() => {
    void loadAnalytics();
    const intervalId = window.setInterval(() => void loadAnalytics(), 5000);
    return () => window.clearInterval(intervalId);
  }, [loadAnalytics]);

  async function handleExport() {
    try {
      const blob = await exportAnalyticsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "analytics.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  }

  if (isLoading && analytics === null) {
    return (
      <RequireAuth>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RequireAuth>
    );
  }

  if (!analytics) {
    return (
      <RequireAuth>
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Unable to load analytics data.
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Adjusted open rate (excl. bots): {analytics.adjusted_open_rate.toFixed(1)}%
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setExcludeBots(!excludeBots)}>
              {excludeBots ? "Show all opens" : "Exclude bot opens"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleExport()}>
              Export CSV
            </Button>
          </div>
        </div>

        <MetricCards analytics={analytics} />
        <ActivityFeed events={analytics.events} />
      </div>
    </RequireAuth>
  );
}
