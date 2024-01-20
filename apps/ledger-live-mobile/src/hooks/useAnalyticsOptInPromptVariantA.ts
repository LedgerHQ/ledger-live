import { useSelector, useDispatch } from "react-redux";
import {
  analyticsEnabledSelector,
  personnalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import { setAnalytics, setPersonnalizedRecommendations } from "~/actions/settings";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

const useAnalyticsOptInPrompt = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const analyticsEnabled: boolean = useSelector(analyticsEnabledSelector);
  const personnalizedRecommendationsEnabled: boolean = useSelector(
    personnalizedRecommendationsEnabledSelector,
  );

  const toggleAnalytics = (value: boolean) => dispatch(setAnalytics(value));
  const togglePersonnalizedRecommendations = (value: boolean) =>
    dispatch(setPersonnalizedRecommendations(value));

  const clickOnAcceptAll = () => {};
  const clickOnRefuseAll = () => {};
  const navigateToMoreOptions = () => {
    navigation.navigate(NavigatorName.AnalyticsOptInPrompt, {
      screen: ScreenName.AnalyticsOptInPromptDetails,
    });
  };
  const clickOnMoreOptionsAllow = () => {};
  const clickOnMoreOptionsNotNow = () => {};
  const clickOnLearnMore = () => {};

  return {
    analyticsEnabled,
    personnalizedRecommendationsEnabled,
    toggleAnalytics,
    togglePersonnalizedRecommendations,
    clickOnAcceptAll,
    clickOnRefuseAll,
    navigateToMoreOptions,
    clickOnMoreOptionsAllow,
    clickOnMoreOptionsNotNow,
    clickOnLearnMore,
  };
};

export default useAnalyticsOptInPrompt;
