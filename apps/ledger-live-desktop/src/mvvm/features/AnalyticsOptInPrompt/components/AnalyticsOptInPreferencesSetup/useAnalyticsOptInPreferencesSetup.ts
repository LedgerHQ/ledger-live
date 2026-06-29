import { useCallback, useEffect, useState } from "react";
import { FieldKeySwitch } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

export type AnalyticsOptInPreferencesCopyKeys = Readonly<{
  analyticsTitle: string;
  analyticsDescription: string;
  personalizationTitle: string;
  personalizationDescription: string;
}>;

export const ANALYTICS_OPT_IN_PREFERENCES_COPY_KEYS = {
  legacy: {
    analyticsTitle: "analyticsOptInPrompt.screen.analyticsData.title",
    analyticsDescription: "analyticsOptInPrompt.screen.analyticsData.description",
    personalizationTitle: "analyticsOptInPrompt.screen.personalizationData.title",
    personalizationDescription: "analyticsOptInPrompt.screen.personalizationData.description",
  },
} as const satisfies Record<string, AnalyticsOptInPreferencesCopyKeys>;

const initialPreferences = (): Record<FieldKeySwitch, boolean> => ({
  AnalyticsData: false,
  PersonalizationData: false,
});

export function useAnalyticsOptInPreferencesSetup(
  onPreferencesChange: (preferences: Record<FieldKeySwitch, boolean>) => void,
) {
  const [preferences, setPreferences] = useState(initialPreferences);

  const togglePreference = useCallback((key: FieldKeySwitch) => {
    setPreferences(prevState => ({ ...prevState, [key]: !prevState[key] }));
  }, []);

  useEffect(() => {
    onPreferencesChange(preferences);
  }, [onPreferencesChange, preferences]);

  return {
    preferences,
    togglePreference,
    setPreferences,
  };
}
