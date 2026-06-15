"use client";

import { CheckCircle2, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EmailCreateResponse } from "@/lib/emails";

interface SnippetDisplayProps {
  response: EmailCreateResponse;
}

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error("Failed to copy to clipboard");
  }
}

export function SnippetDisplay({ response }: SnippetDisplayProps) {
  const trackedLinkEntries = Object.entries(response.tracked_links);

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle>Tracking Assets Ready</CardTitle>
        </div>
        <CardDescription>
          Embed the pixel in your HTML email body and replace destination links with the masked
          tracking URLs below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium">Tracking Pixel HTML</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(response.tracking_pixel, "Pixel snippet")}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed">
            <code>{response.tracking_pixel}</code>
          </pre>
        </div>

        {trackedLinkEntries.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium">Masked Tracking URLs</p>
              </div>
              {trackedLinkEntries.map(([originalUrl, trackedUrl]) => (
                <div key={originalUrl} className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-xs text-muted-foreground">Original: {originalUrl}</p>
                  <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 text-xs">
                    <code>{trackedUrl}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(trackedUrl, "Tracking URL")}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Tracking URL
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
