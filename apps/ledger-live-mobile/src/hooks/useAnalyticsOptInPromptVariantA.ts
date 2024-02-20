import { useDispatch, useSelector } from "react-redux";
import {
  setAnalytics,
  setHasSeenAnalyticsOptInPrompt,
  setPersonalizedRecommendations,
} from "~/actions/settings";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocale } from "~/context/Locale";
import { track, updateIdentify } from "~/analytics";
import { hasSeenAnalyticsOptInPromptSelector, trackingEnabledSelector } from "~/reducers/settings";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";

type Props = {
  entryPoint: EntryPoint;
};

const trackingKeysByFlow: Record<EntryPoint, string> = {
  Onboarding: "consent onboarding",
  Portfolio: "consent existing users",
};

const useAnalyticsOptInPrompt = ({ entryPoint }: Props) => {
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const navigation =
    useNavigation<
      RootNavigationComposite<StackNavigatorNavigation<OnboardingNavigatorParamList>>
    >();
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const shouldWeTrack = isTrackingEnabled || !hasSeenAnalyticsOptInPrompt;
  const flow = trackingKeysByFlow?.[entryPoint];

  const continueOnboarding = () => {
    dispatch(setHasSeenAnalyticsOptInPrompt(true));

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
        navigation.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.Onboarding,
          params: {
            screen: ScreenName.OnboardingPostWelcomeSelection,
            params: {
              userHasDevice: true,
            },
          },
        });
        break;
    }
    updateIdentify(undefined, shouldWeTrack);
  };

  const clickOnAcceptAll = () => {
    dispatch(setAnalytics(true));
    dispatch(setPersonalizedRecommendations(true));
    continueOnboarding();
    track(
      "button_clicked",
      {
        button: "Accept All",
        variant: "A",
        flow,
        page: "Analytics Opt In Prompt Main",
      },
      true,
    );
  };
  const clickOnRefuseAll = () => {
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
    continueOnboarding();
    track(
      "button_clicked",
      {
        button: "Refuse All",
        variant: "A",
        flow,
        page: "Analytics Opt In Prompt Main",
      },
      shouldWeTrack,
    );
  };
  const navigateToMoreOptions = () => {
    navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
      screen: ScreenName.AnalyticsOptInPromptDetails,
      params: {
        entryPoint,
      },
    });
    track(
      "button_clicked",
      {
        button: "Manage Preferences",
        variant: "A",
        flow,
        page: "Analytics Opt In Prompt Main",
      },
      shouldWeTrack,
    );
  };
  const clickOnMoreOptionsConfirm = (
    isAnalyticsEnabled: boolean,
    isPersonalRecommendationsEnabled: boolean,
  ) => {
    dispatch(setAnalytics(isAnalyticsEnabled));
    dispatch(setPersonalizedRecommendations(isPersonalRecommendationsEnabled));
    continueOnboarding();
    track(
      "button_clicked",
      {
        button: "Share",
        variant: "A",
        flow,
        page: "Analytics Opt In Prompt Preferences",
      },
      shouldWeTrack,
    );
  };
  const clickOnLearnMore = () => {
    Linking.openURL(
      (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en,
    );
    track(
      "button_clicked",
      {
        button: "Learn More",
        variant: "A",
        flow,
      },
      shouldWeTrack,
    );
  };

  return {
    shouldWeTrack,
    clickOnAcceptAll,
    clickOnRefuseAll,
    navigateToMoreOptions,
    clickOnMoreOptionsConfirm,
    clickOnLearnMore,
    flow,
  };
};

export default useAnalyticsOptInPrompt;
