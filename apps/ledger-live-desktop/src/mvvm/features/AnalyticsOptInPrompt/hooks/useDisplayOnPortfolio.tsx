import { useEffect } from "react";
import { useAnalyticsOptInPrompt } from "LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";

export const useDisplayOnPortfolioAnalytics = () => {
  const {
    analyticsOptInPromptProps,
    setIsAnalyticsOptInPromptOpened,
    isFeatureFlagsAnalyticsPrefDisplayed,
    onSubmit,
  } = useAnalyticsOptInPrompt({ entryPoint: EntryPoint.portfolio });

  const extendedAnalyticsOptInPromptProps = {
    ...analyticsOptInPromptProps,
    onSubmit,
  };

  useEffect(() => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) setIsAnalyticsOptInPromptOpened(true);
  }, [isFeatureFlagsAnalyticsPrefDisplayed, setIsAnalyticsOptInPromptOpened]);

  return {
    analyticsOptInPromptProps: extendedAnalyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed,
  };
};
