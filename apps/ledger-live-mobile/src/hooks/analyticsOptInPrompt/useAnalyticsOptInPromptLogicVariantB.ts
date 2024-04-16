import { useDispatch } from "react-redux";
import { setAnalytics, setPersonalizedRecommendations } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import useAnalyticsOptInPromptLogic from "./useAnalyticsOptInPromptLogic";
import { ABTestingVariants } from "@ledgerhq/types-live";

type Props = {
  entryPoint: EntryPoint;
};

const useAnalyticsOptInPromptLogicVariantB = ({ entryPoint }: Props) => {
  const variant = ABTestingVariants.variantB;
  const dispatch = useDispatch();
  const { continueOnboarding, flow, shouldWeTrack, navigation, clickOnLearnMore } =
    useAnalyticsOptInPromptLogic({ entryPoint, variant });

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
        variant,
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
        variant,
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
        variant,
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
        variant,
        flow,
        page: "Recommendations Opt In Prompt Main",
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

export default useAnalyticsOptInPromptLogicVariantB;
