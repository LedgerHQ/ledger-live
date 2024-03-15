import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setShareAnalytics,
  setSharePersonalizedRecommandations,
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
    setIsManagingPreferences(true);
    setPreventBackNavigation(true);
    trackClick("Manage Preferences", shouldWeTrack);
  };

  const handleShareAnalyticsChange = (value: boolean) => {
    dispatch(setSharePersonalizedRecommandations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
    if (value) trackClick("Accept All", true);
    else trackClick("Refuse All", shouldWeTrack);
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommandations(PersonalizationData));
      onSubmit?.();
      trackClick("Share", shouldWeTrack);
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

  const trackClick = (button: string, shouldWeTrack: boolean) => {
    track(
      "button_clicked",
      {
        button,
        variant,
        flow,
        page: "Analytics Opt In Prompt Main",
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
