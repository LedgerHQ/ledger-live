import { useFeature } from "@features/platform-feature-flags";
import { useNavigation } from "@react-navigation/core";
import { useEffect } from "react";
import { useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { hasSeenAnalyticsOptInPromptSelector } from "~/reducers/settings";

const usePortfolioAnalyticsOptInPrompt = () => {
  const navigation = useNavigation();
  const llmAnalyticsOptInPromptFeature = useFeature("llmAnalyticsOptInPrompt");
  const analyticsOptInFeature = useFeature("analyticsOptIn");
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);

  useEffect(() => {
    if (analyticsOptInFeature?.enabled) {
      return;
    }

    const entryPoints = llmAnalyticsOptInPromptFeature?.params?.entryPoints || [];

    if (
      !hasSeenAnalyticsOptInPrompt &&
      llmAnalyticsOptInPromptFeature?.enabled &&
      entryPoints.includes("Portfolio")
    ) {
      navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
        screen: ScreenName.AnalyticsOptInPromptMain,
        params: {
          entryPoint: "Portfolio",
        },
      });
    }
  }, [
    hasSeenAnalyticsOptInPrompt,
    analyticsOptInFeature?.enabled,
    llmAnalyticsOptInPromptFeature?.enabled,
    llmAnalyticsOptInPromptFeature?.params?.entryPoints,
    navigation,
  ]);
};

export default usePortfolioAnalyticsOptInPrompt;
