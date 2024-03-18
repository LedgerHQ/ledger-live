import { useEffect, useState } from "react";
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

interface UseVariantAProps {
  setPreventBackNavigation: (value: boolean) => void;
  goBackToMain: boolean;
  onSubmit?: () => void;
  entryPoint: EntryPoint;
}

const useVariantA = ({
  setPreventBackNavigation,
  goBackToMain,
  onSubmit,
  entryPoint,
}: UseVariantAProps) => {
  const variant = ABTestingVariants.variantA;
  const dispatch = useDispatch();

  const [isManagingPreferences, setIsManagingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const { flow, shouldWeTrack } = useAnalyticsOptInPrompt({ entryPoint });

  useEffect(() => {
    if (goBackToMain) setIsManagingPreferences(false);
  }, [goBackToMain]);

  const onManagePreferencesClick = () => {
    const page = "Analytics Opt In Prompt Main";
    setIsManagingPreferences(true);
    setPreventBackNavigation(true);
    trackClick("Manage Preferences", shouldWeTrack, page);
  };

  const handleShareAnalyticsChange = (value: boolean) => {
    const page = "Analytics Opt In Prompt Main";
    dispatch(setSharePersonalizedRecommendations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
    if (value) trackClick("Accept All", true, page);
    else trackClick("Refuse All", shouldWeTrack, page);
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const page = "Analytics Opt In Prompt Preferences";
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommendations(PersonalizationData));
      onSubmit?.();
      trackClick("Share", shouldWeTrack, page);
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
        page: "Analytics Opt In Prompt Preferences",
      },
      shouldWeTrack,
    );
  };

  return {
    isManagingPreferences,
    setIsManagingPreferences,
    onManagePreferencesClick,
    handleShareAnalyticsChange,
    handleShareCustomAnalyticsChange,
    handlePreferencesChange,
  };
};

export default useVariantA;
