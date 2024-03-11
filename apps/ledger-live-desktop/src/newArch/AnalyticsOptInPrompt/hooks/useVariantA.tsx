import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setShareAnalytics,
  setSharePersonalizedRecommandations,
} from "~/renderer/actions/settings";
import { FieldKeySwitch } from "LLD/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

interface UseVariantAProps {
  setPreventBackNavigation: (value: boolean) => void;
  goBackToMain: boolean;
  onSubmit?: () => void;
}

const useVariantA = ({ setPreventBackNavigation, goBackToMain, onSubmit }: UseVariantAProps) => {
  const dispatch = useDispatch();

  const [isManagingPreferences, setIsManagingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const onManagePreferencesClick = useCallback(() => {
    setIsManagingPreferences(true);
    setPreventBackNavigation(true);
  }, [setPreventBackNavigation]);

  useEffect(() => {
    if (goBackToMain) setIsManagingPreferences(false);
  }, [goBackToMain]);

  const handleShareAnalyticsChange = (value: boolean) => {
    dispatch(setSharePersonalizedRecommandations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommandations(PersonalizationData));
      onSubmit?.();
    }
  };

  const handlePreferencesChange = (preferences: Record<FieldKeySwitch, boolean>) => {
    setPreferences(preferences);
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
