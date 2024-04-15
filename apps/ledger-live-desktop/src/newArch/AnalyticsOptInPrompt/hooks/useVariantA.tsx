import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import {
  EntryPoint,
  FieldKeySwitch,
} from "LLD/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import { track } from "~/renderer/analytics/segment";
import { useAnalyticsOptInPrompt } from "./useCommonLogic";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { steps } from "LLD/AnalyticsOptInPrompt/const/steps";

interface UseVariantAProps {
  onSubmit?: () => void;
  entryPoint: EntryPoint;
  setStep: (value: number) => void;
}

const useVariantA = ({ onSubmit, entryPoint, setStep }: UseVariantAProps) => {
  const variant = ABTestingVariants.variantA;
  const dispatch = useDispatch();

  const [preferences, setPreferences] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const { flow, shouldWeTrack, handleOpenPrivacyPolicy } = useAnalyticsOptInPrompt({ entryPoint });

  const onManagePreferencesClick = () => {
    setStep(1);
    trackClick("Manage Preferences", shouldWeTrack, steps.variantA.main);
  };

  const handleShareAnalyticsChange = (value: boolean) => {
    dispatch(setSharePersonalizedRecommendations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
    if (value) trackClick("Accept All", true, steps.variantA.main);
    else trackClick("Refuse All", shouldWeTrack, steps.variantA.main);
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommendations(PersonalizationData));
      onSubmit?.();
      trackClick("Share", shouldWeTrack, steps.variantA.preferences);
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
        variant,
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
        variant,
        flow,
        page: steps.variantA.preferences,
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

export default useVariantA;
