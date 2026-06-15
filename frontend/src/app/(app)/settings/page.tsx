"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [trackingDomain, setTrackingDomain] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [disclosureText, setDisclosureText] = useState("");
  const [appendDisclosure, setAppendDisclosure] = useState(false);

  useEffect(() => {
    if (user) {
      setTrackingDomain(user.tracking_domain ?? "");
      setWebhookUrl(user.webhook_url ?? "");
      setDisclosureText(user.disclosure_text ?? "");
      setAppendDisclosure(user.append_disclosure);
    }
  }, [user]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          tracking_domain: trackingDomain || null,
          webhook_url: webhookUrl || null,
          webhook_secret: webhookSecret || null,
          disclosure_text: disclosureText || null,
          append_disclosure: appendDisclosure,
        }),
      });
      await refreshUser();
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function testWebhook() {
    try {
      await apiFetch("/api/auth/webhooks/test", { method: "POST" });
      toast.success("Test webhook sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Webhook test failed");
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tracking & Webhooks</CardTitle>
            <CardDescription>Custom domain, webhooks, and disclosure footer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Custom tracking domain</Label>
                <Input
                  placeholder="https://track.yourdomain.com"
                  value={trackingDomain}
                  onChange={(e) => setTrackingDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Webhook secret</Label>
                <Input value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={appendDisclosure}
                  onChange={(e) => setAppendDisclosure(e.target.checked)}
                />
                <Label>Append tracking disclosure to emails (extension)</Label>
              </div>
              <div className="space-y-2">
                <Label>Disclosure text</Label>
                <Input value={disclosureText} onChange={(e) => setDisclosureText(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => void testWebhook()}>
                  Test webhook
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
