import { useEffect } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useAnalyticsOptInPrompt } from "LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";

export const useDisplayOnPortfolioAnalytics = () => {
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");

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

  const shouldShowPortfolioAnalyticsOptInPrompt = isFeatureFlagsAnalyticsPrefDisplayed;

  useEffect(() => {
    if (isWallet40Enabled) {
      // Wallet V4 handles consent on the home route via AnalyticsConsentDialog; skip the legacy modal.
      return;
    }
    if (shouldShowPortfolioAnalyticsOptInPrompt) {
      setIsAnalyticsOptInPromptOpened(true);
    }
  }, [shouldShowPortfolioAnalyticsOptInPrompt, setIsAnalyticsOptInPromptOpened, isWallet40Enabled]);

  return {
    analyticsOptInPromptProps: extendedAnalyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed: shouldShowPortfolioAnalyticsOptInPrompt,
  };
};
