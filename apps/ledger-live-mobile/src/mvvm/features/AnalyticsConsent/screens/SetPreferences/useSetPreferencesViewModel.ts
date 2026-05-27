import { useCallback, useState } from "react";
import { useDispatch } from "~/context/hooks";
import { setAnalytics, setPersonalizedRecommendations } from "~/actions/settings";
import { track } from "~/analytics";
import { EntryPoint } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import useAnalyticsConsentLogic from "~/hooks/analyticsOptInPrompt/useAnalyticsConsentLogic";
import usePrivacyPolicyPress from "../../hooks/usePrivacyPolicyPress";

type Props = {
  entryPoint: EntryPoint;
};

const useSetPreferencesViewModel = ({ entryPoint }: Props) => {
  const dispatch = useDispatch();
  const { shouldWeTrack, flow, continueOnboarding } = useAnalyticsConsentLogic({ entryPoint });
  const onPrivacyPolicyPress = usePrivacyPolicyPress({ flow, shouldWeTrack });

  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);
  const [isPersonalRecommendationsEnabled, setIsPersonalRecommendationsEnabled] = useState(false);

  const handleConfirm = useCallback(() => {
    dispatch(setAnalytics(isAnalyticsEnabled));
    dispatch(setPersonalizedRecommendations(isPersonalRecommendationsEnabled));
    track(
      "button_clicked",
      {
        button: "Confirm",
        flow,
      },
      shouldWeTrack,
    );
    continueOnboarding();
  }, [
    isAnalyticsEnabled,
    isPersonalRecommendationsEnabled,
    flow,
    dispatch,
    continueOnboarding,
    shouldWeTrack,
  ]);

  return {
    isAnalyticsEnabled,
    setIsAnalyticsEnabled,
    isPersonalRecommendationsEnabled,
    setIsPersonalRecommendationsEnabled,
    handleConfirm,
    flow,
    shouldWeTrack,
    onPrivacyPolicyPress,
  };
};

export default useSetPreferencesViewModel;
