import type { SettingsPort } from "@features/flow-settings";
import type { PrivacySettingsValues, PrivacyUpdate } from "./types";

/** What a change of a Privacy setting does in the app. One method per change. */
export type PrivacySideEffects = Readonly<{
  setBugReports(value: boolean): void;
  setAnalytics(value: boolean): void;
  setPersonalizedRecommendations(value: boolean): void;
  setAnalyticsAndRecommendations(value: boolean): void;
}>;

/** The port the app provides to the Privacy section: its values and its changes. */
export type PrivacySettingsPort = SettingsPort<PrivacySettingsValues, PrivacyUpdate>;
