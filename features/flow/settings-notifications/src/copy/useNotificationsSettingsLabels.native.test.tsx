import { renderHook } from "@testing-library/react-native";
import { I18nWrapper } from "../__tests__/i18nWrapper";
import { useNotificationsSettingsLabels } from "./useNotificationsSettingsLabels";

describe("useNotificationsSettingsLabels", () => {
  it("reads the legacy wording of each row", () => {
    const { result } = renderHook(() => useNotificationsSettingsLabels(), { wrapper: I18nWrapper });

    expect(result.current.rows.areNotificationsAllowed).toEqual({
      title: "Allow notifications",
      description: "Receive notifications",
    });
    expect(result.current.rows.largeMoverCategory.title).toBe("Price Alerts");
    expect(result.current.rows.transactionsAlertsCategory.title).toBe("Transaction Alerts (Beta)");
  });

  it("reads the wording of the banner", () => {
    const { result } = renderHook(() => useNotificationsSettingsLabels(), { wrapper: I18nWrapper });

    expect(result.current.osPermissionBanner).toEqual({
      title: "Notifications are disabled",
      description: "Go to your phone settings.",
      action: "Turn on notifications",
    });
  });
});
