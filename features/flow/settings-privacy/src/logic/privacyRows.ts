import type { PrivacySettingsValues, PrivacyUpdate } from "../types";

export type PrivacyToggleRowId =
  | "bugReports"
  | "appPerformance"
  | "personalizedExperience"
  | "analytics";

export type PrivacyRowId = PrivacyToggleRowId | "privacyPolicy";

/**
 * The rows of the Privacy section, in order. App performance and Personalized experience have
 * their own toggle, or share one Analytics toggle when the consents are not separate.
 */
export function getPrivacyRowIds(
  values: Pick<PrivacySettingsValues, "separateAnalyticsConsents">,
): readonly PrivacyRowId[] {
  const analyticsRows: readonly PrivacyRowId[] = values.separateAnalyticsConsents
    ? ["appPerformance", "personalizedExperience"]
    : ["analytics"];
  return ["bugReports", ...analyticsRows, "privacyPolicy"];
}

/** The Analytics toggle is on only while both consents are given. */
export function getPrivacyToggleValue(
  id: PrivacyToggleRowId,
  values: PrivacySettingsValues,
): boolean {
  switch (id) {
    case "bugReports":
      return values.bugReports;
    case "appPerformance":
      return values.analytics;
    case "personalizedExperience":
      return values.personalizedRecommendations;
    case "analytics":
      return values.analytics && values.personalizedRecommendations;
  }
}

export function toPrivacyUpdate(id: PrivacyToggleRowId, value: boolean): PrivacyUpdate {
  switch (id) {
    case "bugReports":
      return { key: "bugReports", value };
    case "appPerformance":
      return { key: "analytics", value };
    case "personalizedExperience":
      return { key: "personalizedRecommendations", value };
    case "analytics":
      return { key: "analyticsAndRecommendations", value };
  }
}
