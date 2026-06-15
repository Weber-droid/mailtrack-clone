"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Does SendBeacon send emails for me?",
    a: "No. SendBeacon only tracks emails you send through Gmail or any client where you embed the tracking pixel or links. You stay in control of delivery.",
  },
  {
    q: "Is my data private?",
    a: "Yes. SendBeacon is self-hosted — tracking events live on your server. We don't sell or share your engagement data.",
  },
  {
    q: "Which browsers support the extension?",
    a: "The SendBeacon extension works on Chrome, Brave, Microsoft Edge, and other Chromium-based browsers with Manifest V3 support.",
  },
  {
    q: "What's included in the free tier?",
    a: "Unlimited tracked emails, the Gmail extension, real-time dashboard, bot filtering, and CSV export. Self-host when you need webhooks, API keys, and teams.",
  },
  {
    q: "Can I integrate with my CRM?",
    a: "Yes. Use webhooks with HMAC signatures or our REST API to push open and click events into Salesforce, HubSpot, or any system.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="marketing-section">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        <div className="mt-12 divide-y">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="py-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left font-medium"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
