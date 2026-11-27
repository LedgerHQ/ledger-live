import { SettingsPortProvider } from "@features/flow-settings";
import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import { createFakeNotificationsPort } from "./__tests__/fakeNotificationsPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import type { NotificationsSettingsValues } from "./types";
import { useNotificationsSettingsViewModel } from "./useNotificationsSettingsViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

function renderViewModel(overrides?: Partial<NotificationsSettingsValues>) {
  const fake = createFakeNotificationsPort(overrides);
  const hook = renderHook(() => useNotificationsSettingsViewModel({ testID: "notifications" }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nWrapper>
        <SettingsPortProvider value={fake.port}>{children}</SettingsPortProvider>
      </I18nWrapper>
    ),
  });
  const row = (id: string) => hook.result.current.rows.find(candidate => candidate.id === id);
  return { ...fake, ...hook, row };
}

describe("useNotificationsSettingsViewModel", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("gives each row its wording, its toggle and a test id", () => {
    const { row } = renderViewModel();

    expect(row("largeMoverCategory")).toMatchObject({
      title: "Price Alerts",
      description: "Price movements",
      disabled: false,
      testID: "settings-notifications-largeMoverCategory",
      trailing: { type: "toggle", value: true },
    });
  });

  it("changes the value and tracks the legacy toggle name", () => {
    const { row, updates } = renderViewModel();

    act(() => {
      const trailing = row("areNotificationsAllowed")?.trailing;
      if (trailing?.type === "toggle") trailing.onToggle(false);
    });

    expect(updates).toEqual([{ key: "areNotificationsAllowed", value: false }]);
    expect(track).toHaveBeenCalledWith("toggle_clicked", {
      toggle: "Toggle_Allow",
      enabled: false,
    });
  });

  it("hides the banner while the phone allows notifications", () => {
    const { result } = renderViewModel();

    expect(result.current.osPermissionBanner).toBeNull();
  });

  it("shows the banner and asks the app for the permission from its action", () => {
    const { result, requestOsPermission } = renderViewModel({ osPermissionAuthorized: false });

    expect(result.current.osPermissionBanner).toMatchObject({
      title: "Notifications are disabled",
      action: "Turn on notifications",
    });

    act(() => result.current.osPermissionBanner?.onPressAction());

    expect(requestOsPermission).toHaveBeenCalledTimes(1);
  });

  it("throws without the port provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderHook(() => useNotificationsSettingsViewModel({}), { wrapper: I18nWrapper }),
    ).toThrow("SettingsPortProvider is missing");
  });
});
