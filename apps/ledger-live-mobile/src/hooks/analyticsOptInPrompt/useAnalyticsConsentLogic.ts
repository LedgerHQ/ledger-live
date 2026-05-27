import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { resolveAnalyticsOptInParams } from "@ledgerhq/live-common/analyticsConsent/index";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  completeOnboarding,
  setAnalytics,
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
  setIsReborn,
  setOnboardingHasDevice,
  setPersonalizedRecommendations,
  setReadOnlyMode,
} from "~/actions/settings";
import { hasSeenAnalyticsOptInPromptSelector, trackingEnabledSelector } from "~/reducers/settings";
import { updateIdentify } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";

type NavigationProp = RootNavigationComposite<
  StackNavigatorNavigation<OnboardingNavigatorParamList>
>;

const trackingKeysByFlow: Record<EntryPoint, string> = {
  Onboarding: "consent onboarding",
  Portfolio: "consent existing users",
};

type Props = {
  entryPoint: EntryPoint;
};

export type UseAnalyticsConsentLogicResult = {
  navigation: NavigationProp;
  shouldWeTrack: boolean;
  flow: string;
  continueOnboarding: () => void;
  handleAcceptAll: () => void;
  handleRefuseAll: () => void;
  goToPersonalizedRecommendationsStep: () => void;
};

const useAnalyticsConsentLogic = ({ entryPoint }: Props): UseAnalyticsConsentLogicResult => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const shouldWeTrack = isTrackingEnabled || !hasSeenAnalyticsOptInPrompt;
  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("mobile");
  const { notifyFlowCompleted } = useNotificationsContext();
  const analyticsOptInFeature = useFeature("analyticsOptIn");
  const { policyVersion } = resolveAnalyticsOptInParams(analyticsOptInFeature);
  const flow = trackingKeysByFlow[entryPoint];

  const skipDeviceOnboarding = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setOnboardingHasDevice(false));
    dispatch(setReadOnlyMode(true));
    dispatch(setIsReborn(true));

    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
      params: {
        screen: NavigatorName.Portfolio,
        params: {
          screen: NavigatorName.WalletTab,
        },
      },
    });

    notifyFlowCompleted("onboarding");
  }, [dispatch, navigation, notifyFlowCompleted]);

  const continueOnboarding = useCallback(() => {
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: policyVersion,
      }),
    );

    switch (entryPoint) {
      case "Portfolio":
        navigation.navigate(NavigatorName.Base, {
          screen: NavigatorName.Main,
          params: {
            screen: NavigatorName.Portfolio,
            params: {
              screen: NavigatorName.WalletTab,
            },
          },
        });
        break;
      case "Onboarding":
        if (shouldUseLazyOnboarding) {
          skipDeviceOnboarding();
        } else {
          navigation.navigate(NavigatorName.BaseOnboarding, {
            screen: NavigatorName.Onboarding,
            params: {
              screen: ScreenName.OnboardingPostWelcomeSelection,
              params: {
                userHasDevice: true,
              },
            },
          });
        }
        break;
    }
    updateIdentify(undefined, shouldWeTrack);
  }, [
    dispatch,
    policyVersion,
    entryPoint,
    navigation,
    shouldUseLazyOnboarding,
    skipDeviceOnboarding,
    shouldWeTrack,
  ]);

  const handleAcceptAll = useCallback(() => {
    dispatch(setAnalytics(true));
    dispatch(setPersonalizedRecommendations(true));
    continueOnboarding();
  }, [dispatch, continueOnboarding]);

  const handleRefuseAll = useCallback(() => {
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
    continueOnboarding();
  }, [dispatch, continueOnboarding]);

  const goToPersonalizedRecommendationsStep = useCallback(() => {
    navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
      screen: ScreenName.AnalyticsOptInPromptDetails,
      params: { entryPoint },
    });
  }, [navigation, entryPoint]);

  return {
    navigation,
    shouldWeTrack,
    flow,
    continueOnboarding,
    handleAcceptAll,
    handleRefuseAll,
    goToPersonalizedRecommendationsStep,
  };
};

export default useAnalyticsConsentLogic;
