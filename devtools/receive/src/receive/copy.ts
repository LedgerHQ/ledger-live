export const copy = {
  flagTitle: "Feature flag",
  flagDescription: "newReceiveFlow: routes every receive entry point to the new flow.",
  flagEnabled: "Enabled",
  excludedFamilies: "Excluded families",
  excludedFamiliesPlaceholder: "bitcoin, tron",
  apply: "Apply",
  triggerTitle: "Receive list",
  triggerDescription: "Opens receive on an account, or from the asset selection.",
  pickAsset: "Pick an asset",
  noAsset: "No account yet: pick an asset to add one.",
  deeplinkTitle: "Deeplink",
  deeplinkDescription: "Fires a receive deeplink as the OS would.",
  deeplinkLabel: "URL",
  openDeeplink: "Open",
  invalidDeeplink: "Not a valid URL.",
} as const;

export const DEFAULT_RECEIVE_DEEPLINK = "ledgerwallet://receive?currency=ethereum";

export const parseFamilies = (value: string): readonly string[] =>
  value
    .split(",")
    .map(family => family.trim())
    .filter(Boolean);
