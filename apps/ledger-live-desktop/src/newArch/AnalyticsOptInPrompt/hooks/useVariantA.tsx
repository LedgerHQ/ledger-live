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
    setIsManagingPreferences(true);
    setPreventBackNavigation(true);
    clickOnManagePreferences();
  };

  const handleShareAnalyticsChange = (value: boolean) => {
    dispatch(setSharePersonalizedRecommendations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
    if (value) clickOnAcceptAll();
    else clickOnRefuseAll();
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommendations(PersonalizationData));
      onSubmit?.();
      clickOnMoreOptionsConfirm();
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

  const clickOnAcceptAll = () => {
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

  const clickOnManagePreferences = () => {
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

  const clickOnMoreOptionsConfirm = () => {
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
