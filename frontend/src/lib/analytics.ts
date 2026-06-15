import { apiFetch } from "@/lib/api";

export interface EventFeedItem {
  recipient: string;
  event_type: "open" | "click" | string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AnalyticsResponse {
  total_emails: number;
  open_rate: number;
  click_rate: number;
  events: EventFeedItem[];
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  return apiFetch<AnalyticsResponse>("/api/analytics");
}
