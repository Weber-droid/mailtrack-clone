"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

interface Campaign {
  id: string;
  name: string;
  subject: string | null;
  total_recipients: number;
  open_rate: number;
  click_rate: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [recipients, setRecipients] = useState("");

  async function load() {
    const data = await apiFetch<Campaign[]>("/api/campaigns");
    setCampaigns(data);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          subject,
          recipients: recipients.split(",").map((r) => r.trim()).filter(Boolean),
        }),
      });
      toast.success("Campaign created");
      setName("");
      setSubject("");
      setRecipients("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <RequireAuth>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create bulk campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Recipients (comma-separated emails)</Label>
                <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} required />
              </div>
              <Button type="submit">Create campaign</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {c.total_recipients} recipients · Open {c.open_rate}% · Click {c.click_rate}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
