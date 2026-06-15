export function ProductMockupGmail() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-400/80" />
        <div className="h-3 w-3 rounded-full bg-amber-400/80" />
        <div className="h-3 w-3 rounded-full bg-green-400/80" />
        <span className="ml-2 text-xs text-muted-foreground">Gmail — Compose</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex gap-2 border-b border-dashed border-border pb-3 text-xs">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked readOnly /> Track opens
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked readOnly /> Track links
          </label>
        </div>
        <div className="text-xs text-muted-foreground">
          To: <span className="text-foreground">prospect@example.com</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Subject: <span className="text-foreground">Following up on our conversation</span>
        </div>
        <div className="min-h-[80px] rounded-md border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          Hi there — just wanted to follow up on my previous email. Let me know if you have any questions.
        </div>
        <div className="flex justify-end">
          <span className="rounded bg-beacon px-4 py-1.5 text-xs font-medium text-accent-foreground">Send</span>
        </div>
      </div>
      <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        Sent folder: Proposal follow-up <span className="text-emerald-600 dark:text-emerald-400">✓✓ Opened</span>
      </div>
    </div>
  );
}
