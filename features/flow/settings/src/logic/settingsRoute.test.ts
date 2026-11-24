import { getSettingsRoute } from "./settingsRoute";

describe("getSettingsRoute", () => {
  it("keeps the legacy Settings while the new ones are off", () => {
    expect(getSettingsRoute("security", false)).toEqual({
      showLegacySettings: true,
      selectedSection: "security",
    });
  });

  it("selects General for the bare address", () => {
    expect(getSettingsRoute("", true)).toEqual({
      showLegacySettings: false,
      selectedSection: "general",
    });
  });

  it("selects the section given in the address", () => {
    expect(getSettingsRoute("privacy", true).selectedSection).toBe("privacy");
  });

  it("selects General for an unknown section", () => {
    expect(getSettingsRoute("unknown", true)).toEqual({
      showLegacySettings: false,
      selectedSection: "general",
    });
  });

  it.each(["help", "experimental", "developer", "developer/info-state-qa"])(
    "keeps the legacy Settings for %s, not in the new Settings yet",
    subPath => {
      expect(getSettingsRoute(subPath, true).showLegacySettings).toBe(true);
    },
  );
});
