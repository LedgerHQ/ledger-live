import type { UpdateOf } from "@features/flow-settings";

export type PrivacyPlatform = "desktop" | "mobile";

/** What the Privacy section reads. */
export type PrivacySettingsValues = Readonly<{
  bugReports: boolean;
  analytics: boolean;
  personalizedRecommendations: boolean;
  /** `false` when one Analytics toggle changes both analytics and personalized recommendations. */
  separateAnalyticsConsents: boolean;
}>;

/** What the Privacy section can change. `analyticsAndRecommendations` sets both consents at once. */
export type EditablePrivacySettings = Pick<
  PrivacySettingsValues,
  "bugReports" | "analytics" | "personalizedRecommendations"
> &
  Readonly<{ analyticsAndRecommendations: boolean }>;

export type PrivacyUpdate = UpdateOf<EditablePrivacySettings>;
