import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useAcceptGeneralTerms } from "~/logic/terms";
import { urls } from "~/utils/urls";
import { NavigatorName, ScreenName } from "~/const/navigation";
import {
  completeOnboarding,
  setAnalytics,
  setIsReborn,
  setOnboardingHasDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { useNotifications } from "LLM/features/NotificationsPrompt";

type NavigationProps = BaseComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingWelcome>
>;

/**
 * Custom hook for handling navigation in the WelcomePage.
 * @returns Callbacks for WelcomePage footer and easter egg navigation
 */
export function useWelcomeNavigation() {
  const dispatch = useDispatch();
  const {
    i18n: { language },
  } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const acceptTerms = useAcceptGeneralTerms();
  const llmAnalyticsOptInPromptFeature = useFeature("llmAnalyticsOptInPrompt");
  const walletFeaturesConfig = useWalletFeaturesConfig("mobile");
  const shouldUseLazyOnboarding =
    (walletFeaturesConfig as typeof walletFeaturesConfig & { shouldUseLazyOnboarding?: boolean })
      .shouldUseLazyOnboarding ?? false;
  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();

  const onTermsAndConditions = useCallback(
    () => Linking.openURL((urls.terms as Record<string, string>)[language] || urls.terms.en),
    [language],
  );
  const onPrivacyPolicy = useCallback(
    () =>
      Linking.openURL(
        (urls.privacyPolicy as Record<string, string>)[language] || urls.privacyPolicy.en,
      ),
    [language],
  );
  const continueWithLazyOnboarding = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setReadOnlyMode(true));
    dispatch(setIsReborn(true));
    dispatch(setOnboardingHasDevice(false));
    navigation.reset({
      index: 0,
      routes: [{ name: NavigatorName.Base } as never],
    });
    tryTriggerPushNotificationDrawerAfterAction("onboarding");
  }, [dispatch, navigation, tryTriggerPushNotificationDrawerAfterAction]);

  const onGetStarted = useCallback(() => {
    acceptTerms();
    const entryPoints = llmAnalyticsOptInPromptFeature?.params?.entryPoints || [];
    if (llmAnalyticsOptInPromptFeature?.enabled && entryPoints.includes("Onboarding")) {
      navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
        screen: ScreenName.AnalyticsOptInPromptMain,
        params: {
          entryPoint: "Onboarding",
        },
      });
    } else {
      dispatch(setAnalytics(true));

      if (shouldUseLazyOnboarding) {
        continueWithLazyOnboarding();
      } else {
        navigation.navigate({
          name: ScreenName.OnboardingPostWelcomeSelection,
          params: {
            userHasDevice: true,
          },
        });
      }
    }
  }, [
    acceptTerms,
    llmAnalyticsOptInPromptFeature?.enabled,
    llmAnalyticsOptInPromptFeature?.params?.entryPoints,
    navigation,
    dispatch,
    shouldUseLazyOnboarding,
    continueWithLazyOnboarding,
  ]);

  const [_, setBooleans] = useState<boolean[]>([]);
  const [isTappingLogo, setIsTappingLogo] = useState<boolean>(false);
  const onLogoTouchStart = useCallback(() => {
    setIsTappingLogo(true);
    const timeoutId = setTimeout(() => {
      setIsTappingLogo(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);
  const onLogoTouchEnd = useCallback(() => {
    setBooleans(prev => {
      const next = [...prev, isTappingLogo].splice(-4);
      if (next.length === 4) {
        if (next[0] && !next[1] && next[2] && next[3]) {
          navigation.navigate(NavigatorName.Base, {
            screen: NavigatorName.Settings,
            params: {
              screen: ScreenName.SettingsScreen,
            },
          });
        }
        return [];
      }
      return next;
    });
    setIsTappingLogo(false);
  }, [isTappingLogo, navigation]);

  useEffect(() => {
    dispatch(setOnboardingHasDevice(null));
    dispatch(setIsReborn(null));
    return () => {
      setBooleans([]);
      setIsTappingLogo(false);
    };
  }, [dispatch]);

  return {
    onTermsAndConditions,
    onPrivacyPolicy,
    onGetStarted,
    onLogoTouchStart,
    onLogoTouchEnd,
  };
}
