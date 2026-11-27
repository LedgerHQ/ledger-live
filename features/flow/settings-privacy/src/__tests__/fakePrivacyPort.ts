import { applyPrivacyUpdate } from "../logic/privacyUpdate";
import type { PrivacySettingsPort } from "../ports";
import type { PrivacySettingsValues, PrivacyUpdate } from "../types";

const DEFAULT_PRIVACY_VALUES: PrivacySettingsValues = {
  bugReports: true,
  analytics: false,
  personalizedRecommendations: false,
  separateAnalyticsConsents: true,
};

/** A port for tests: values change with each update, as the app would, and updates are recorded. */
export function createFakePrivacyPort(initial?: Partial<PrivacySettingsValues>) {
  const updates: PrivacyUpdate[] = [];
  const state: { values: PrivacySettingsValues } = {
    values: { ...DEFAULT_PRIVACY_VALUES, ...initial },
  };
  const change = (values: Partial<PrivacySettingsValues>) => {
    state.values = { ...state.values, ...values };
  };

  const port: PrivacySettingsPort = {
    get values() {
      return state.values;
    },
    setValue(update) {
      updates.push(update);
      applyPrivacyUpdate(
        {
          setBugReports: bugReports => change({ bugReports }),
          setAnalytics: analytics => change({ analytics }),
          setPersonalizedRecommendations: personalizedRecommendations =>
            change({ personalizedRecommendations }),
          setAnalyticsAndRecommendations: value =>
            change({ analytics: value, personalizedRecommendations: value }),
        },
        update,
      );
    },
  };

  return { port, updates };
}
