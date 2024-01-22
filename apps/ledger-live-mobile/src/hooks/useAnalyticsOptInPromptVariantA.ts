import { useSelector, useDispatch } from "react-redux";
import {
  analyticsEnabledSelector,
  personalizedRecommendationsEnabledSelector,
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

  const toggleAnalytics = (value: boolean) => dispatch(setAnalytics(value));
  const togglePersonalizedRecommendations = (value: boolean) =>
    dispatch(setPersonalizedRecommendations(value));

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
    updateIdentify();
  };
  const clickOnAcceptAll = () => {
    dispatch(setAnalytics(true));
    dispatch(setPersonalizedRecommendations(true));
    continueOnboarding();
    track("button_clicked", {
      button: "Accept All",
      variant: "A",
    });
  };
  const clickOnRefuseAll = () => {
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
    continueOnboarding();
    track("button_clicked", {
      button: "Refuse All",
      variant: "A",
    });
  };
  const navigateToMoreOptions = () => {
    navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
      screen: ScreenName.AnalyticsOptInPromptDetails,
    });
    track("button_clicked", {
      button: "More Options",
      variant: "A",
    });
  };
  const clickOnMoreOptionsConfirm = () => {
    continueOnboarding();
    track("button_clicked", {
      button: "Confirm",
      variant: "A",
    });
  };
  const clickOnLearnMore = () => {
    Linking.openURL(
      (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en,
    );
    track("button_clicked", {
      button: "Learn More",
      variant: "A",
    });
  };

  return {
    analyticsEnabled,
    personalizedRecommendationsEnabled,
    toggleAnalytics,
    togglePersonalizedRecommendations,
    clickOnAcceptAll,
    clickOnRefuseAll,
    navigateToMoreOptions,
    clickOnMoreOptionsConfirm,
    clickOnLearnMore,
  };
};

export default useAnalyticsOptInPrompt;
