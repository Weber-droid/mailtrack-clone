"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ActivityFeed } from "@/components/activity-feed";
import { MetricCards } from "@/components/metric-cards";
import { fetchAnalytics, type AnalyticsResponse } from "@/lib/analytics";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load analytics";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
    const intervalId = window.setInterval(() => {
      void loadAnalytics();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [loadAnalytics]);

  if (isLoading && analytics === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Unable to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor campaign performance and live tracking activity across all dispatched emails.
        </p>
      </div>

      <MetricCards analytics={analytics} />
      <ActivityFeed events={analytics.events} />
    </div>
  );
}
