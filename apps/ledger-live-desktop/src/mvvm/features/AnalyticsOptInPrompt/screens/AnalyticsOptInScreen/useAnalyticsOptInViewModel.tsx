import { useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
import {
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import {
  EntryPoint,
  FieldKeySwitch,
} from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import { track } from "~/renderer/analytics/segment";
import { useAnalyticsOptInPrompt } from "../../hooks/useCommonLogic";
import { steps } from "../../const/steps";

interface UseAnalyticsOptInViewModelProps {
  onSubmit?: () => void;
  entryPoint: EntryPoint;
  setStep: (value: number) => void;
}

const useAnalyticsOptInViewModel = ({
  onSubmit,
  entryPoint,
  setStep,
}: UseAnalyticsOptInViewModelProps) => {
  const dispatch = useDispatch();

  const [preferences, setPreferences] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const { flow, shouldWeTrack, handleOpenPrivacyPolicy } = useAnalyticsOptInPrompt({ entryPoint });

  const onManagePreferencesClick = () => {
    setStep(1);
    trackClick("Manage Preferences", shouldWeTrack, steps.main);
  };

  const handleShareAnalyticsChange = (value: boolean) => {
    dispatch(setSharePersonalizedRecommendations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
    if (value) trackClick("Accept All", true, steps.main);
    else trackClick("Refuse All", shouldWeTrack, steps.main);
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommendations(PersonalizationData));
      onSubmit?.();
      trackClick("Share", shouldWeTrack, steps.preferences);
    }
  };

  const handlePreferencesChange = (newPreferences: Record<FieldKeySwitch, boolean>) => {
    const oldPreferences = preferences;
    setPreferences(newPreferences);
    for (const key in newPreferences) {
      const fieldKey = key as FieldKeySwitch;
      if (newPreferences[fieldKey] !== oldPreferences[fieldKey]) {
        clickOnToggle(fieldKey, newPreferences[fieldKey]);
      }
    }
  };

  const trackClick = (button: string, shouldWeTrack: boolean, page: string) => {
    track(
      "button_clicked",
      {
        button,
        flow,
        page,
      },
      shouldWeTrack,
    );
  };

  const clickOnToggle = (field: FieldKeySwitch, value: boolean) => {
    track(
      "toggle_clicked",
      {
        toggle:
          field === FieldKeySwitch.AnalyticsData ? "Analytics" : "Personalised Recommendations",
        value,
        flow,
        page: steps.preferences,
      },
      shouldWeTrack,
    );
  };

  return {
    onManagePreferencesClick,
    handleShareAnalyticsChange,
    handleShareCustomAnalyticsChange,
    handlePreferencesChange,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  };
};

export default useAnalyticsOptInViewModel;
