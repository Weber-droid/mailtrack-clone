"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeOnboarding } from "@/lib/auth";

export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);

  async function finish() {
    try {
      await completeOnboarding();
      await refreshUser();
      toast.success("You're all set!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete onboarding");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to SendBeacon</h1>
        <p className="text-muted-foreground">Complete these steps to start tracking emails.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {step} of 3</CardTitle>
          <CardDescription>
            {step === 1 && "Install the browser extension"}
            {step === 2 && "Load the extension in Brave or Chrome"}
            {step === 3 && "Send a test email from Gmail"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <p className="text-sm text-muted-foreground">
              Open <code className="rounded bg-muted px-1">brave://extensions</code> or{" "}
              <code className="rounded bg-muted px-1">chrome://extensions</code>, enable Developer mode, and
              click Load unpacked. Select the <code className="rounded bg-muted px-1">extension/</code> folder from
              this project.
            </p>
          )}
          {step === 2 && (
            <p className="text-sm text-muted-foreground">
              Click the extension icon, sign in with the same account you just created, and set API URL to{" "}
              <code className="rounded bg-muted px-1">http://localhost:8000</code> for local dev.
            </p>
          )}
          {step === 3 && (
            <p className="text-sm text-muted-foreground">
              Compose an email in Gmail with tracking enabled and click Send. Check the dashboard for open and click
              events.
            </p>
          )}
          <div className="flex gap-2">
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={() => void finish()}>Finish setup</Button>
            )}
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={() => void finish()}>
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
