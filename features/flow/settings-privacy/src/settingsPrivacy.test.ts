import { getSettingsPrivacyPackageName } from "./settingsPrivacy";

describe("getSettingsPrivacyPackageName", () => {
  it("returns the package name", () => {
    expect(getSettingsPrivacyPackageName()).toBe("@features/flow-settings-privacy");
  });
});
