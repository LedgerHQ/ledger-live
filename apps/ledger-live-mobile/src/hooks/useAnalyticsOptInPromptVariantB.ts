import { useSelector, useDispatch } from "react-redux";
import { hasSeenAnalyticsOptInPromptSelector, trackingEnabledSelector } from "~/reducers/settings";
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

  const goToPersonalizedRecommendationsStep = () => {
    navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
      screen: ScreenName.AnalyticsOptInPromptDetails,
      params: {
        entryPoint,
      },
    });
  };

  const clickOnRefuseAnalytics = () => {
    dispatch(setAnalytics(false));
    goToPersonalizedRecommendationsStep();
    track(
      "button_clicked",
      {
        button: "Refuse Analytics",
        variant: "B",
        flow,
        page: "Analytics Opt In Prompt Main",
      },
      shouldWeTrack,
    );
  };
  const clickOnAllowAnalytics = () => {
    dispatch(setAnalytics(true));
    goToPersonalizedRecommendationsStep();
    track(
      "button_clicked",
      {
        button: "Accept Analytics",
        variant: "B",
        flow,
        page: "Analytics Opt In Prompt Main",
      },
      shouldWeTrack,
    );
  };
  const clickOnAllowPersonalizedExperience = () => {
    dispatch(setPersonalizedRecommendations(true));
    continueOnboarding();
    track(
      "button_clicked",
      {
        button: "Accept Personal Recommendations",
        variant: "B",
        flow,
        page: "Recommendations Opt In Prompt Main",
      },
      shouldWeTrack,
    );
  };
  const clickOnRefusePersonalizedExperience = () => {
    dispatch(setPersonalizedRecommendations(false));
    continueOnboarding();
    track(
      "button_clicked",
      {
        button: "Refuse Personal Recommendations",
        variant: "B",
        flow,
        page: "Recommendations Opt In Prompt Main",
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
        variant: "B",
        flow,
      },
      shouldWeTrack,
    );
  };

  return {
    shouldWeTrack,
    clickOnRefuseAnalytics,
    clickOnAllowAnalytics,
    clickOnAllowPersonalizedExperience,
    clickOnRefusePersonalizedExperience,
    clickOnLearnMore,
    flow,
  };
};

export default useAnalyticsOptInPrompt;
