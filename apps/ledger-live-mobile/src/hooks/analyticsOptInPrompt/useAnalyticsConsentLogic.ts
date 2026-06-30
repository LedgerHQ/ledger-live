import { useCallback } from "react";
import {
  CommonActions,
  StackActions,
  type NavigatorScreenParams,
  useNavigation,
} from "@react-navigation/native";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { resolveAnalyticsOptInParams } from "@ledgerhq/live-common/analyticsConsent/index";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  setAnalytics,
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
  setPersonalizedRecommendations,
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
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt";
import { useCompleteLazyOnboarding } from "LLM/features/NotificationsOptIn";

type NavigationProp = RootNavigationComposite<
  StackNavigatorNavigation<OnboardingNavigatorParamList>
>;

const trackingKeysByFlow: Record<EntryPoint, string> = {
  Onboarding: "consent onboarding",
  Portfolio: "consent existing users",
};

const portfolioBaseScreen: NavigatorScreenParams<BaseNavigatorStackParamList> = {
  screen: NavigatorName.Main,
  params: {
    screen: NavigatorName.Portfolio,
    params: {
      screen: NavigatorName.WalletTab,
    },
  },
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
  const lwmNotificationsOptIn = useFeature("lwmNotificationsOptIn");
  const completeLazyOnboarding = useCompleteLazyOnboarding();
  const { policyVersion } = resolveAnalyticsOptInParams(analyticsOptInFeature);
  const flow = trackingKeysByFlow[entryPoint];

  const skipDeviceOnboarding = useCallback(() => {
    completeLazyOnboarding({
      triggerNotificationsPrompt: () => notifyFlowCompleted("onboarding"),
    });
  }, [completeLazyOnboarding, notifyFlowCompleted]);

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
        // Reset clears the Analytics opt-in prompt from the native back stack.
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: NavigatorName.Base,
                params: portfolioBaseScreen,
              },
            ],
          }),
        );
        break;
      case "Onboarding":
        if (shouldUseLazyOnboarding) {
          if (lwmNotificationsOptIn?.enabled) {
            navigation
              .getParent()
              ?.dispatch(StackActions.push(ScreenName.OnboardingNotificationsOptIn));
          } else {
            skipDeviceOnboarding();
          }
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
    lwmNotificationsOptIn?.enabled,
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
