"use client";

import { useState } from "react";

import { CampaignForm } from "@/components/campaign-form";
import { SnippetDisplay } from "@/components/snippet-display";
import type { EmailCreateResponse } from "@/lib/emails";

export default function HomePage() {
  const [response, setResponse] = useState<EmailCreateResponse | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Campaign Generator</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Generate a hidden tracking pixel and masked redirect links for your outbound email
          campaigns.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <CampaignForm onSuccess={setResponse} />
        {response ? (
          <SnippetDisplay response={response} />
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
            Submit the form to generate your tracking pixel and link snippets.
          </div>
        )}
      </div>
    </div>
  );
}
