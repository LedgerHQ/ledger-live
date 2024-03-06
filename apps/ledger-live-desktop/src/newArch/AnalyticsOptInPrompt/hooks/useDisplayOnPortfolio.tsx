import { useEffect } from "react";
import { useAnalyticsOptInPrompt } from "~/newArch/AnalyticsOptInPrompt/hooks/useCommonLogic";

export const useDisplayOnPortfolioAnalytics = () => {
  const {
    analyticsOptInPromptProps,
    setIsAnalitycsOptInPromptOpened,
    isFeatureFlagsAnalyticsPrefDisplayed,
    onSubmit,
  } = useAnalyticsOptInPrompt({ entryPoint: "Portfolio" });

  const extendedAnalyticsOptInPromptProps = {
    ...analyticsOptInPromptProps,
    onSubmit,
  };

  useEffect(() => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) setIsAnalitycsOptInPromptOpened(true);
  }, [isFeatureFlagsAnalyticsPrefDisplayed, setIsAnalitycsOptInPromptOpened]);

  return {
    analyticsOptInPromptProps: extendedAnalyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed,
  };
};
