import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocale } from "~/context/Locale";
import { track } from "~/analytics";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import useAnalyticsConsentLogic from "./useAnalyticsConsentLogic";

type Props = {
  entryPoint: EntryPoint;
};

const useAnalyticsOptInPromptLogic = ({ entryPoint }: Props) => {
  const { locale } = useLocale();
  const {
    navigation,
    shouldWeTrack,
    flow,
    continueOnboarding,
    handleAcceptAll,
    handleRefuseAll,
    goToPersonalizedRecommendationsStep,
  } = useAnalyticsConsentLogic({ entryPoint });

  const trackingPolicyUrl =
    (urls.trackingPolicy as Record<string, string>)[locale] || urls.trackingPolicy.en;

  const clickOnLearnMore = () => {
    Linking.openURL(trackingPolicyUrl);
    track(
      "button_clicked",
      {
        button: "Learn More",
        flow,
      },
      shouldWeTrack,
    );
  };

  return {
    navigation,
    shouldWeTrack,
    continueOnboarding,
    clickOnLearnMore,
    flow,
    handleAcceptAll,
    handleRefuseAll,
    goToPersonalizedRecommendationsStep,
  };
};

export default useAnalyticsOptInPromptLogic;
