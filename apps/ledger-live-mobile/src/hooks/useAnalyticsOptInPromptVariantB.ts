import { useSelector, useDispatch } from "react-redux";
import {
  analyticsEnabledSelector,
  personalizedRecommendationsEnabledSelector,
  trackingEnabledSelector,
} from "~/reducers/settings";
import { setAnalytics, setPersonalizedRecommendations } from "~/actions/settings";
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

const useAnalyticsOptInPrompt = () => {
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const navigation =
    useNavigation<
      RootNavigationComposite<StackNavigatorNavigation<OnboardingNavigatorParamList>>
    >();
  const analyticsEnabled: boolean = useSelector(analyticsEnabledSelector);
  const personalizedRecommendationsEnabled: boolean = useSelector(
    personalizedRecommendationsEnabledSelector,
  );
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  // When the user has not made a choice yet, we can track the analytics opt in flow
  const shouldWeTrack = isTrackingEnabled === true || isTrackingEnabled === null;

  const continueOnboarding = () => {
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingPostWelcomeSelection,
        params: {
          userHasDevice: true,
        },
      },
    });
    updateIdentify(undefined, shouldWeTrack);
  };
  const goToPersonalizedRecommendationsStep = () => {
    navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
      screen: ScreenName.AnalyticsOptInPromptDetails,
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
        flow: "consent onboarding",
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
        flow: "consent onboarding",
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
        flow: "consent onboarding",
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
        flow: "consent onboarding",
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
        flow: "consent onboarding",
      },
      shouldWeTrack,
    );
  };

  return {
    shouldWeTrack,
    analyticsEnabled,
    personalizedRecommendationsEnabled,
    clickOnRefuseAnalytics,
    clickOnAllowAnalytics,
    clickOnAllowPersonalizedExperience,
    clickOnRefusePersonalizedExperience,
    clickOnLearnMore,
  };
};

export default useAnalyticsOptInPrompt;
