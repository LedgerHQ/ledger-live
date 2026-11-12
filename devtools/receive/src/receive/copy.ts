export const copy = {
  flagTitle: "Feature flag",
  flagDescription: "newReceiveFlow: routes every receive entry point to the new flow.",
  flagEnabled: "Enabled",
  excludedFamilies: "Excluded families",
  excludedFamiliesPlaceholder: "bitcoin, tron",
  apply: "Apply",
  verifyHintTitle: "Verify hint",
  verifyHintDescription: "The first-time tooltip on the Verify button.",
  verifyHintSeen: "Already seen",
  triggerTitle: "Receive",
  triggerDescription: "Open the receive screen of an account, or pick any asset.",
  pickAsset: "Pick any asset",
  searchPlaceholder: "Search an account",
  noAsset: "No account matches.",
  deeplinkTitle: "Deeplink",
  deeplinkDescription: "Open the receive deeplink in the app (currency param optional).",
  deeplinkLabel: "Deeplink",
  openDeeplink: "Open deeplink",
  defaultDeeplink: "ledgerlive://receive?currency=bitcoin",
} as const;

export const parseFamilies = (value: string): readonly string[] =>
  value
    .split(",")
    .map(family => family.trim())
    .filter(Boolean);

export const matchesSearch = (search: string, label: string, ticker: string) => {
  const query = search.trim().toLowerCase();
  return !query || label.toLowerCase().includes(query) || ticker.toLowerCase().includes(query);
};
