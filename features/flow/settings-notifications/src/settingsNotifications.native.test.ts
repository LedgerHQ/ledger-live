import { getSettingsNotificationsPackageName } from "./settingsNotifications";

describe("getSettingsNotificationsPackageName", () => {
  it("returns the package name", () => {
    expect(getSettingsNotificationsPackageName()).toBe("@features/flow-settings-notifications");
  });
});
