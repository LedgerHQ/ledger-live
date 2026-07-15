import React from "react";
import AnalyticsOptInPrompt from "LLD/features/AnalyticsOptInPrompt/screens";
import { useDisplayOnPortfolioAnalytics } from "LLD/features/AnalyticsOptInPrompt/hooks/useDisplayOnPortfolio";
import Portfolio from "LLD/features/Portfolio";

export default function PortfolioPage() {
  const { isFeatureFlagsAnalyticsPrefDisplayed, analyticsOptInPromptProps } =
    useDisplayOnPortfolioAnalytics();

  return (
    <>
      <Portfolio />

      {isFeatureFlagsAnalyticsPrefDisplayed && (
        <AnalyticsOptInPrompt {...analyticsOptInPromptProps} />
      )}
    </>
  );
}
