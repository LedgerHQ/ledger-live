import { SHARED_HELP_ITEM_IDS } from "./helpItems";
import { getHelpConfirmationScreen, getHelpItemEvent, HELP_SCREENS } from "./helpTracking";

describe("getHelpItemEvent", () => {
  it.each([
    ["clearCache", "ClearCacheIntent"],
    ["resetApp", "HardResetIntent"],
    ["launchOnboarding", "Launch Onboarding from Settings"],
  ] as const)("sends the legacy desktop event of %s", (id, event) => {
    expect(getHelpItemEvent(id, "desktop")).toEqual({ event });
  });

  it("sends nothing for the desktop links", () => {
    expect(getHelpItemEvent("support", "desktop")).toBeNull();
  });

  it.each([
    ["support", "LedgerSupport"],
    ["academy", "LedgerAcademy"],
    ["saveLogs", "SaveLogs"],
    ["status", "LedgerStatus"],
    ["clearCache", "ClearCache"],
  ] as const)("sends the My Wallet Help button of %s on mobile", (id, button) => {
    expect(getHelpItemEvent(id, "mobile")).toEqual({
      event: "button_clicked",
      properties: { button, page: "Help" },
    });
  });

  it("sends an event for every mobile row", () => {
    expect(SHARED_HELP_ITEM_IDS.every(id => getHelpItemEvent(id, "mobile"))).toBe(true);
  });
});

describe("screens", () => {
  it("tracks the Help screen of each app", () => {
    expect(HELP_SCREENS.desktop).toEqual({ category: "Settings", name: "Help" });
    expect(HELP_SCREENS.mobile).toEqual({ category: "My Wallet", name: "Help" });
  });

  it("tracks the confirmation modals on desktop only", () => {
    expect(getHelpConfirmationScreen("clearCache", "desktop")).toBe("CleanCache");
    expect(getHelpConfirmationScreen("resetApp", "desktop")).toBe("HardReset");
    expect(getHelpConfirmationScreen("clearCache", "mobile")).toBeNull();
  });
});
