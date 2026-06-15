"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CTABanner } from "@/components/marketing/cta-banner";
import { FAQ } from "@/components/marketing/faq";
import { FeaturesBento } from "@/components/marketing/features-bento";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AnalyticsPreview } from "@/components/marketing/analytics-preview";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { SocialProof } from "@/components/marketing/social-proof";
import { useAuth } from "@/components/auth-provider";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.onboarding_completed ? "/dashboard" : "/onboarding");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Loading...</div>
    );
  }

  return (
    <>
      <Hero />
      <SocialProof />
      <FeaturesBento />
      <HowItWorks />
      <AnalyticsPreview />
      <PricingTeaser />
      <FAQ />
      <CTABanner />
    </>
  );
}
