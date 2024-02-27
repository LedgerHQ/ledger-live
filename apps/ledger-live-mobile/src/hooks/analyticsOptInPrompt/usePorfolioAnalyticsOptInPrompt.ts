import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/core";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { NavigatorName, ScreenName } from "~/const";
import { hasSeenAnalyticsOptInPromptSelector } from "~/reducers/settings";

const usePortfolioAnalyticsOptInPrompt = () => {
  const navigation = useNavigation();
  const llmAnalyticsOptInPromptFeature = useFeature("llmAnalyticsOptInPrompt");
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);

  useEffect(() => {
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
    llmAnalyticsOptInPromptFeature?.enabled,
    llmAnalyticsOptInPromptFeature?.params?.entryPoints,
    navigation,
  ]);
};

export default usePortfolioAnalyticsOptInPrompt;
