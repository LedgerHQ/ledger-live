import type { HelpConfirmedItemId, HelpItemId, HelpPlatform, SharedHelpItemId } from "./helpItems";

export type HelpTrackingEvent = Readonly<{
  event: string;
  properties?: Readonly<Record<string, string>>;
}>;

export type HelpScreen = Readonly<{ category: string; name: string }>;

/** The events of the legacy desktop Help buttons. */
const DESKTOP_ITEM_EVENTS: Readonly<Partial<Record<HelpItemId, string>>> = {
  clearCache: "ClearCacheIntent",
  viewUserData: "View user data",
  resetApp: "HardResetIntent",
  launchOnboarding: "Launch Onboarding from Settings",
};

/** The `button` of the `button_clicked` events of My Wallet Help. */
const MOBILE_ITEM_BUTTONS: Readonly<Record<SharedHelpItemId, string>> = {
  support: "LedgerSupport",
  academy: "LedgerAcademy",
  saveLogs: "SaveLogs",
  status: "LedgerStatus",
  clearCache: "ClearCache",
};

const MOBILE_TRACKING_PAGE = "Help";

const isMobileItem = (id: HelpItemId): id is SharedHelpItemId => id in MOBILE_ITEM_BUTTONS;

/** The event sent when a row is pressed, or `null` when the row sends none. */
export function getHelpItemEvent(id: HelpItemId, platform: HelpPlatform): HelpTrackingEvent | null {
  if (platform === "mobile") {
    return isMobileItem(id)
      ? {
          event: "button_clicked",
          properties: { button: MOBILE_ITEM_BUTTONS[id], page: MOBILE_TRACKING_PAGE },
        }
      : null;
  }
  const event = DESKTOP_ITEM_EVENTS[id];
  return event ? { event } : null;
}

export const HELP_SCREENS: Readonly<Record<HelpPlatform, HelpScreen>> = {
  desktop: { category: "Settings", name: "Help" },
  mobile: { category: "My Wallet", name: "Help" },
};

const DESKTOP_CONFIRMATION_SCREENS: Readonly<Record<HelpConfirmedItemId, string>> = {
  clearCache: "CleanCache",
  resetApp: "HardReset",
};

/** The modal screen tracked while a confirmation is open. Mobile tracks none. */
export function getHelpConfirmationScreen(
  id: HelpConfirmedItemId,
  platform: HelpPlatform,
): string | null {
  return platform === "desktop" ? DESKTOP_CONFIRMATION_SCREENS[id] : null;
}
