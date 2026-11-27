import type { PrivacySideEffects } from "../ports";
import type { PrivacyUpdate } from "../types";

const EDITABLE_PRIVACY_KEYS: ReadonlySet<string> = new Set<PrivacyUpdate["key"]>([
  "bugReports",
  "analytics",
  "personalizedRecommendations",
  "analyticsAndRecommendations",
]);

/** Tells whether a change of the Settings port belongs to the Privacy section. */
export function isPrivacyUpdate(update: Readonly<{ key: string }>): update is PrivacyUpdate {
  return EDITABLE_PRIVACY_KEYS.has(update.key);
}

/** Runs the side effect of one change: exactly one call, chosen by the key. */
export function applyPrivacyUpdate(effects: PrivacySideEffects, update: PrivacyUpdate): void {
  switch (update.key) {
    case "bugReports":
      effects.setBugReports(update.value);
      return;
    case "analytics":
      effects.setAnalytics(update.value);
      return;
    case "personalizedRecommendations":
      effects.setPersonalizedRecommendations(update.value);
      return;
    case "analyticsAndRecommendations":
      effects.setAnalyticsAndRecommendations(update.value);
      return;
  }
}
