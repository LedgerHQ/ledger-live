import { useDispatch } from "~/context/hooks";
import { setAnalytics, setPersonalizedRecommendations } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import useAnalyticsOptInPromptLogic from "./useAnalyticsOptInPromptLogic";

type Props = {
  entryPoint: EntryPoint;
};

const useAnalyticsOptInPromptLogicVariantA = ({ entryPoint }: Props) => {
  const dispatch = useDispatch();
  const {
    continueOnboarding,
    flow,
    shouldWeTrack,
    navigation,
    clickOnLearnMore,
    handleAcceptAll,
    handleRefuseAll,
  } = useAnalyticsOptInPromptLogic({ entryPoint });

  const clickOnAcceptAll = () => {
    handleAcceptAll();
    track(
      "button_clicked",
      {
        button: "Accept All",
        flow,
        page: "Analytics Opt In Prompt Main",
      },
      true,
    );
  };
  const clickOnRefuseAll = () => {
    handleRefuseAll();
    track(
      "button_clicked",
      {
        button: "Refuse All",
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
