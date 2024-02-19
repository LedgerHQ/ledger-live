import { useDispatch, useSelector } from "react-redux";
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
import {
  analyticsEnabledSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";

const useAnalyticsOptInPrompt = () => {
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const navigation =
    useNavigation<
      RootNavigationComposite<StackNavigatorNavigation<OnboardingNavigatorParamList>>
    >();
  const analyticsEnabled = useSelector(analyticsEnabledSelector);
  const personalizedRecommendationsEnabled = useSelector(
    personalizedRecommendationsEnabledSelector,
  );
  const isTrackingEnabled = analyticsEnabled || personalizedRecommendationsEnabled;
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
  const clickOnAcceptAll = () => {
    dispatch(setAnalytics(true));
    dispatch(setPersonalizedRecommendations(true));
    continueOnboarding();
    track(
      "button_clicked",
      {
        button: "Accept All",
        variant: "A",
        flow: "consent onboarding",
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
        flow: "consent onboarding",
      },
      shouldWeTrack,
    );
  };
  const navigateToMoreOptions = () => {
    navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
      screen: ScreenName.AnalyticsOptInPromptDetails,
    });
    track(
      "button_clicked",
      {
        button: "More Options",
        variant: "A",
        flow: "consent onboarding",
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
        button: "Confirm",
        variant: "A",
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
        variant: "A",
        flow: "consent onboarding",
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
  };
};

export default useAnalyticsOptInPrompt;
