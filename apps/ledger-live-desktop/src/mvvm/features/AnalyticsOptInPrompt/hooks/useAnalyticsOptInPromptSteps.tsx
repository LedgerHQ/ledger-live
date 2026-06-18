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
import { useAnalyticsOptInPrompt } from "./useCommonLogic";
import { ANALYTICS_OPT_IN_VARIANT } from "../types/variants";
import { ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES } from "LLD/features/AnalyticsOptInPrompt/const/steps";

interface UseAnalyticsOptInPromptStepsProps {
  onSubmit?: () => void;
  entryPoint: EntryPoint;
  setStep: (value: number) => void;
}

export const useAnalyticsOptInPromptSteps = ({
  onSubmit,
  entryPoint,
  setStep,
}: UseAnalyticsOptInPromptStepsProps) => {
  const dispatch = useDispatch();

  const [preferences, setPreferences] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const { flow, shouldWeTrack, handleOpenPrivacyPolicy } = useAnalyticsOptInPrompt({ entryPoint });

  const onManagePreferencesClick = () => {
    setStep(1);
    trackClick("Manage Preferences", shouldWeTrack, ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.main);
  };

  const handleShareAnalyticsChange = (value: boolean) => {
    dispatch(setSharePersonalizedRecommendations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
    if (value) trackClick("Accept All", true, ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.main);
    else trackClick("Refuse All", shouldWeTrack, ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.main);
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommendations(PersonalizationData));
      onSubmit?.();
      trackClick("Share", shouldWeTrack, ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.preferences);
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

  const trackClick = (button: string, shouldTrack: boolean, page: string) => {
    track(
      "button_clicked",
      {
        button,
        variant: ANALYTICS_OPT_IN_VARIANT,
        flow,
        page,
      },
      shouldTrack,
    );
  };

  const clickOnToggle = (field: FieldKeySwitch, value: boolean) => {
    track(
      "toggle_clicked",
      {
        toggle:
          field === FieldKeySwitch.AnalyticsData ? "Analytics" : "Personalised Recommendations",
        value,
        variant: ANALYTICS_OPT_IN_VARIANT,
        flow,
        page: ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.preferences,
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
