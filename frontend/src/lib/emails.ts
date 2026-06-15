import { apiFetch } from "@/lib/api";

export interface EmailCreatePayload {
  recipient: string;
  subject?: string;
  links?: string[];
}

export interface EmailCreateResponse {
  email_id: string;
  tracking_pixel: string;
  tracked_links: Record<string, string>;
}

export async function createEmail(payload: EmailCreatePayload): Promise<EmailCreateResponse> {
  return apiFetch<EmailCreateResponse>("/api/emails", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
