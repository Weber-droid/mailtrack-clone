import { MousePointerClick, Mail, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AnalyticsResponse } from "@/lib/analytics";

interface MetricCardsProps {
  analytics: AnalyticsResponse;
}

export function MetricCards({ analytics }: MetricCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Emails Dispatched</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.total_emails}</div>
          <p className="text-xs text-muted-foreground">Campaigns registered in the system</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-3xl font-bold">{analytics.open_rate.toFixed(1)}%</div>
          <Progress value={analytics.open_rate} />
          <p className="text-xs text-muted-foreground">Unique opens across all campaigns</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Link Click-Through Rate</CardTitle>
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-3xl font-bold">{analytics.click_rate.toFixed(1)}%</div>
          <Progress value={analytics.click_rate} />
          <p className="text-xs text-muted-foreground">Unique clicks across all campaigns</p>
        </CardContent>
      </Card>
    </div>
  );
}
