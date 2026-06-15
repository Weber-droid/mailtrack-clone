"use client";

import { Loader2, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmail, type EmailCreateResponse } from "@/lib/emails";

interface CampaignFormProps {
  onSuccess: (response: EmailCreateResponse) => void;
}

export function CampaignForm({ onSuccess }: CampaignFormProps) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [linkDestination, setLinkDestination] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await createEmail({
        recipient,
        subject: subject || undefined,
        links: linkDestination ? [linkDestination] : undefined,
      });
      onSuccess(response);
      toast.success("Tracking assets generated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create email";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Campaign Generator</CardTitle>
        </div>
        <CardDescription>
          Create a tracked email campaign and copy the generated pixel and link snippets into your
          message body.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email</Label>
            <Input
              id="recipient"
              type="email"
              required
              placeholder="recipient@example.com"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Your campaign subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">Click-Tracking Link Destination (optional)</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://example.com/landing-page"
              value={linkDestination}
              onChange={(event) => setLinkDestination(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Tracking Assets"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
