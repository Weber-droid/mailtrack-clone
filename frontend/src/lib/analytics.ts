import { apiFetch } from "@/lib/api";

export interface EventFeedItem {
  recipient: string;
  event_type: "open" | "click" | string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  link_id: string | null;
  is_probable_bot: boolean;
}

export interface AnalyticsResponse {
  total_emails: number;
  open_rate: number;
  click_rate: number;
  adjusted_open_rate: number;
  events: EventFeedItem[];
  top_browsers: Array<{ name: string; count: number }>;
  top_countries: Array<{ name: string; count: number }>;
}

export async function fetchAnalytics(excludeBots = false): Promise<AnalyticsResponse> {
  const params = excludeBots ? "?exclude_bots=true" : "";
  return apiFetch<AnalyticsResponse>(`/api/analytics${params}`);
}

export async function exportAnalyticsCsv(): Promise<Blob> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const { getToken } = await import("@/lib/auth-storage");
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/analytics/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Export failed");
  return response.blob();
}
