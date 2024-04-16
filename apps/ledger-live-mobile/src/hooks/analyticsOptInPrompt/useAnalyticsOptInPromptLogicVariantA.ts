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

const useAnalyticsOptInPromptLogicVariantA = ({ entryPoint }: Props) => {
  const variant = ABTestingVariants.variantA;
  const dispatch = useDispatch();
  const { continueOnboarding, flow, shouldWeTrack, navigation, clickOnLearnMore } =
    useAnalyticsOptInPromptLogic({ entryPoint, variant });

  const clickOnAcceptAll = () => {
    dispatch(setAnalytics(true));
    dispatch(setPersonalizedRecommendations(true));
    continueOnboarding();
    track(
      "button_clicked",
      {
        button: "Accept All",
        variant,
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
        variant,
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
        variant,
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
        variant,
        flow,
        page: "Analytics Opt In Prompt Preferences",
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

export default useAnalyticsOptInPromptLogicVariantA;
