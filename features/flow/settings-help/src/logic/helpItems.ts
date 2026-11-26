export const HELP_ITEM_IDS = [
  "support",
  "academy",
  "saveLogs",
  "status",
  "clearCache",
  "viewUserData",
  "troubleshootNetwork",
  "repairDevice",
  "launchOnboarding",
  "resetApp",
] as const;

export type HelpItemId = (typeof HELP_ITEM_IDS)[number];

export type HelpGroupId = "supportAndLearning" | "more";

export type HelpItemAction = "external" | "button" | "slot";

/** Actions that ask for a confirmation first, because they erase data. */
export type HelpConfirmedItemId = "clearCache" | "resetApp";

export const HELP_GROUPS: readonly Readonly<{ id: HelpGroupId; items: readonly HelpItemId[] }>[] = [
  { id: "supportAndLearning", items: ["support", "academy"] },
  {
    id: "more",
    items: [
      "saveLogs",
      "status",
      "clearCache",
      "viewUserData",
      "troubleshootNetwork",
      "repairDevice",
      "launchOnboarding",
      "resetApp",
    ],
  },
];

export const HELP_ITEM_ACTIONS: Readonly<Record<HelpItemId, HelpItemAction>> = {
  support: "external",
  academy: "external",
  saveLogs: "slot",
  status: "external",
  clearCache: "button",
  viewUserData: "button",
  troubleshootNetwork: "button",
  repairDevice: "slot",
  launchOnboarding: "button",
  resetApp: "button",
};

const CONFIRMED_ITEMS: ReadonlySet<HelpItemId> = new Set<HelpItemId>(["clearCache", "resetApp"]);

export function isConfirmedHelpItem(id: HelpItemId): id is HelpConfirmedItemId {
  return CONFIRMED_ITEMS.has(id);
}

export const HELP_ITEM_EVENTS: Readonly<Partial<Record<HelpItemId, string>>> = {
  clearCache: "ClearCacheIntent",
  resetApp: "HardResetIntent",
  troubleshootNetwork: "TroubleshootNetwork",
  launchOnboarding: "Launch Onboarding from Settings",
};

export const HELP_CONFIRMATION_SCREENS: Readonly<Record<HelpConfirmedItemId, string>> = {
  clearCache: "CleanCache",
  resetApp: "HardReset",
};
