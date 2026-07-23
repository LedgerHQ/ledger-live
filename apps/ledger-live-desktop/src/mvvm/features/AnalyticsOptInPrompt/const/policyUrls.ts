import { urls } from "~/config/urls";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";

export type AnalyticsOptInVariant = "A" | "B";

/** Onboarding variant B links to the tracking policy; all other paths use privacy policy. */
export const analyticsOptInPolicyUrlByVariant = {
  A: urls.privacyPolicy,
  B: urls.trackingPolicy,
} as const;

export function resolveAnalyticsOptInPolicyUrl(
  entryPoint: EntryPoint,
  variant: AnalyticsOptInVariant,
): string {
  if (entryPoint === EntryPoint.onboarding && variant === "B") {
    return analyticsOptInPolicyUrlByVariant.B;
  }

  return analyticsOptInPolicyUrlByVariant.A;
}
