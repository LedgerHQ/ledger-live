import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import { urls } from "~/config/urls";
import { analyticsOptInPolicyUrlByVariant, resolveAnalyticsOptInPolicyUrl } from "../policyUrls";

describe("resolveAnalyticsOptInPolicyUrl", () => {
  it("should use privacy policy for variant A onboarding", () => {
    expect(resolveAnalyticsOptInPolicyUrl(EntryPoint.onboarding, "A")).toBe(
      analyticsOptInPolicyUrlByVariant.A,
    );
  });

  it("should use tracking policy for variant B onboarding", () => {
    expect(resolveAnalyticsOptInPolicyUrl(EntryPoint.onboarding, "B")).toBe(
      analyticsOptInPolicyUrlByVariant.B,
    );
  });

  it("should use privacy policy for portfolio regardless of variant", () => {
    expect(resolveAnalyticsOptInPolicyUrl(EntryPoint.portfolio, "B")).toBe(urls.privacyPolicy);
  });
});
