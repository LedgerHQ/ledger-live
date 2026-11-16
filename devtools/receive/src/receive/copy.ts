export const copy = {
  flagTitle: "Feature flag",
  flagDescription: "newReceiveFlow: routes every receive entry point to the new flow.",
  flagEnabled: "Enabled",
  excludedFamilies: "Excluded families",
  excludedFamiliesPlaceholder: "bitcoin, tron",
  apply: "Apply",
} as const;

export const parseFamilies = (value: string): readonly string[] =>
  value
    .split(",")
    .map(family => family.trim())
    .filter(Boolean);
