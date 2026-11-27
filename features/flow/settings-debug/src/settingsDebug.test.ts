import { getSettingsDebugPackageName } from "./settingsDebug";

describe("getSettingsDebugPackageName", () => {
  it("returns the package name", () => {
    expect(getSettingsDebugPackageName()).toBe("@features/flow-settings-debug");
  });
});
