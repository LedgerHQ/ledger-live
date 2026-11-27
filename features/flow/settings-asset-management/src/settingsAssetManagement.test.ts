import { getSettingsAssetManagementPackageName } from "./settingsAssetManagement";

describe("getSettingsAssetManagementPackageName", () => {
  it("returns the package name", () => {
    expect(getSettingsAssetManagementPackageName()).toBe(
      "@features/flow-settings-asset-management",
    );
  });
});
