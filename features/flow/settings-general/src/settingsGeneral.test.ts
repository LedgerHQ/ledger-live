import { getSettingsGeneralPackageName } from "./settingsGeneral";

describe("getSettingsGeneralPackageName", () => {
  it("returns the package name", () => {
    expect(getSettingsGeneralPackageName()).toBe("@features/flow-settings-general");
  });
});
