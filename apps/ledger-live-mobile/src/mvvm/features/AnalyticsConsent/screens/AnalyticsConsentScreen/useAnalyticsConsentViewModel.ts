import { useCallback } from "react";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import type { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import useAnalyticsConsentLogic from "~/hooks/analyticsOptInPrompt/useAnalyticsConsentLogic";
import { resolveLottieSource } from "LLM/components/Lottie";
import darkAnimation from "../../animations/dark.lottie";
import lightAnimation from "../../animations/light.lottie";
import usePrivacyPolicyPress from "../../hooks/usePrivacyPolicyPress";
import { ANALYTICS_CONSENT_PAGE } from "../../const";

const darkAnimationSource = resolveLottieSource(darkAnimation);
const lightAnimationSource = resolveLottieSource(lightAnimation);

type RouteProp = {
  params?: { entryPoint?: EntryPoint };
};

export const useAnalyticsConsentViewModel = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const route = useRoute() as RouteProp;
  const { bottom: bottomInset } = useSafeAreaInsets();

  const entryPoint: EntryPoint = route.params?.entryPoint ?? "Onboarding";
  const animationSource = theme === "dark" ? darkAnimationSource : lightAnimationSource;

  const {
    shouldWeTrack,
    flow,
    handleAcceptAll,
    handleRefuseAll,
    goToPersonalizedRecommendationsStep,
  } = useAnalyticsConsentLogic({ entryPoint });

  const onPrivacyPolicyPress = usePrivacyPolicyPress({ flow, shouldWeTrack });

  const onSetPreferencesPress = useCallback(() => {
    goToPersonalizedRecommendationsStep();
    track(
      "button_clicked",
      {
        button: "Set Preferences",
        flow,
        page: ANALYTICS_CONSENT_PAGE,
      },
      shouldWeTrack,
    );
  }, [goToPersonalizedRecommendationsStep, flow, shouldWeTrack]);

  const onAcceptPress = useCallback(() => {
    handleAcceptAll();
    track(
      "button_clicked",
      {
        button: "Accept All",
        flow,
        page: ANALYTICS_CONSENT_PAGE,
      },
      true,
    );
  }, [handleAcceptAll, flow]);

  const onRefusePress = useCallback(() => {
    handleRefuseAll();
    track(
      "button_clicked",
      {
        button: "Refuse All",
        flow,
        page: ANALYTICS_CONSENT_PAGE,
      },
      shouldWeTrack,
    );
  }, [handleRefuseAll, flow, shouldWeTrack]);

  return {
    title: t("analyticsConsent.title"),
    subTitle: t("analyticsConsent.subTitle"),
    setPreferencesCTA: t("analyticsConsent.setPreferencesCTA"),
    refuseCTA: t("analyticsConsent.refuseCTA"),
    acceptCTA: t("analyticsConsent.acceptCTA"),
    animationSource,
    bottomInset,
    onSetPreferencesPress,
    onRefusePress,
    onAcceptPress,
    onPrivacyPolicyPress,
    shouldWeTrack,
    flow,
  };
};
