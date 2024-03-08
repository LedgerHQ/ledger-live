import { useEffect } from "react";
import { useAnalyticsOptInPrompt } from "LLD/AnalyticsOptInPrompt/hooks/useCommonLogic";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";

export const useDisplayOnPortfolioAnalytics = () => {
  const {
    analyticsOptInPromptProps,
    setIsAnalitycsOptInPromptOpened,
    isFeatureFlagsAnalyticsPrefDisplayed,
    onSubmit,
  } = useAnalyticsOptInPrompt({ entryPoint: EntryPoint.portfolio });

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
