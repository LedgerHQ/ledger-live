export const HELP_ITEM_IDS = [
  "support",
  "academy",
  "saveLogs",
  "status",
  "clearCache",
  "viewUserData",
  "repairDevice",
  "launchOnboarding",
  "resetApp",
] as const;

export type HelpItemId = (typeof HELP_ITEM_IDS)[number];

/** The rows both apps show. The other rows are desktop's. */
export const SHARED_HELP_ITEM_IDS = [
  "support",
  "academy",
  "saveLogs",
  "status",
  "clearCache",
] as const satisfies readonly HelpItemId[];

export type SharedHelpItemId = (typeof SHARED_HELP_ITEM_IDS)[number];

export type DesktopHelpItemId = Exclude<HelpItemId, SharedHelpItemId>;

export type HelpPlatform = "desktop" | "mobile";

export type HelpGroupId = "supportAndLearning" | "more";

export type HelpItemAction = "external" | "button" | "slot";

/** Actions that ask for a confirmation first, because they erase data. */
export type HelpConfirmedItemId = "clearCache" | "resetApp";

export type HelpGroup = Readonly<{ id: HelpGroupId; items: readonly HelpItemId[] }>;

const SUPPORT_AND_LEARNING: HelpGroup = { id: "supportAndLearning", items: ["support", "academy"] };

const HELP_GROUPS: Readonly<Record<HelpPlatform, readonly HelpGroup[]>> = {
  desktop: [
    SUPPORT_AND_LEARNING,
    {
      id: "more",
      items: [
        "saveLogs",
        "status",
        "clearCache",
        "viewUserData",
        "repairDevice",
        "launchOnboarding",
        "resetApp",
      ],
    },
  ],
  mobile: [SUPPORT_AND_LEARNING, { id: "more", items: ["saveLogs", "status", "clearCache"] }],
};

export function getHelpGroups(platform: HelpPlatform): readonly HelpGroup[] {
  return HELP_GROUPS[platform];
}

const DESKTOP_ITEM_ACTIONS: Readonly<Record<HelpItemId, HelpItemAction>> = {
  support: "external",
  academy: "external",
  saveLogs: "slot",
  status: "external",
  clearCache: "button",
  viewUserData: "button",
  repairDevice: "slot",
  launchOnboarding: "button",
  resetApp: "button",
};

/** Mobile saves the logs through its port; desktop renders its legacy export button. */
export function getHelpItemAction(id: HelpItemId, platform: HelpPlatform): HelpItemAction {
  if (platform === "mobile" && id === "saveLogs") return "button";
  return DESKTOP_ITEM_ACTIONS[id];
}

const CONFIRMED_ITEMS: ReadonlySet<HelpItemId> = new Set<HelpItemId>(["clearCache", "resetApp"]);

export function isConfirmedHelpItem(id: HelpItemId): id is HelpConfirmedItemId {
  return CONFIRMED_ITEMS.has(id);
}

/** Mobile asks to clear the cache as an information, as My Wallet Help always did. */
export function getHelpConfirmationTone(
  id: HelpConfirmedItemId,
  platform: HelpPlatform,
): "destructive" | "neutral" {
  return platform === "mobile" && id === "clearCache" ? "neutral" : "destructive";
}
