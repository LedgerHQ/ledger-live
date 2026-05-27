import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocale } from "~/context/Locale";
import { track } from "~/analytics";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import { ABTestingVariants } from "@ledgerhq/types-live";
import useAnalyticsConsentLogic from "./useAnalyticsConsentLogic";

type Props = {
  entryPoint: EntryPoint;
  variant: ABTestingVariants;
};

const useAnalyticsOptInPromptLogic = ({ entryPoint, variant }: Props) => {
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

  const privacyPolicyUrl =
    (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en;

  const trackingPolicyUrl =
    (urls.trackingPolicy as Record<string, string>)[locale] || urls.trackingPolicy.en;

  const urlByVariant = {
    [ABTestingVariants.variantA]: trackingPolicyUrl,
    [ABTestingVariants.variantB]: privacyPolicyUrl,
  };

  const clickOnLearnMore = () => {
    Linking.openURL(urlByVariant[variant]);
    track(
      "button_clicked",
      {
        button: "Learn More",
        variant,
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
