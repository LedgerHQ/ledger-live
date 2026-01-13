export const EntryPoint = {
  onboarding: "onboarding",
  portfolio: "portfolio",
} as const;

export type EntryPoint = (typeof EntryPoint)[keyof typeof EntryPoint];

export const FieldKeySwitch = {
  AnalyticsData: "AnalyticsData",
  PersonalizationData: "PersonalizationData",
} as const;

export type FieldKeySwitch = (typeof FieldKeySwitch)[keyof typeof FieldKeySwitch];
