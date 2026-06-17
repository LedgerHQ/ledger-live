import { useFeature } from "@features/platform-feature-flags";
import { useNavigation } from "@react-navigation/core";
import { useEffect } from "react";
import { useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { hasSeenAnalyticsOptInPromptSelector } from "~/reducers/settings";

const usePortfolioAnalyticsOptInPrompt = () => {
  const navigation = useNavigation();
  const analyticsOptInFeature = useFeature("analyticsOptIn");
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);

  useEffect(() => {
    if (analyticsOptInFeature?.enabled) {
      return;
    }

    if (!hasSeenAnalyticsOptInPrompt) {
      navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
        screen: ScreenName.AnalyticsOptInPromptMain,
        params: {
          entryPoint: "Portfolio",
        },
      });
    }
  }, [hasSeenAnalyticsOptInPrompt, analyticsOptInFeature?.enabled, navigation]);
};

export default usePortfolioAnalyticsOptInPrompt;
