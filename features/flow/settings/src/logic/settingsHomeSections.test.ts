import { SETTINGS_HOME_SECTIONS } from "./settingsHomeSections";
import { SETTINGS_SECTIONS } from "./settingsSections";

describe("SETTINGS_HOME_SECTIONS", () => {
  it("lists the mobile sections in the order of the design", () => {
    expect(SETTINGS_HOME_SECTIONS).toEqual([
      "general",
      "assetManagement",
      "security",
      "notifications",
      "privacy",
      "about",
    ]);
  });

  it("holds every desktop section plus Notifications", () => {
    expect(SETTINGS_HOME_SECTIONS.filter(section => section !== "notifications")).toEqual(
      SETTINGS_SECTIONS,
    );
  });
});
