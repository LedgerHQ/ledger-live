import { SettingsPortProvider } from "@features/flow-settings";
import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import {
  ALL_NOTIFICATIONS_ON,
  createFakeNotificationsPort,
} from "./__tests__/fakeNotificationsPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { NotificationsSettings } from "./NotificationsSettings";
import type { NotificationsSettingsValues } from "./types";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

function renderSection(overrides?: Partial<NotificationsSettingsValues>) {
  const fake = createFakeNotificationsPort(overrides);
  render(
    <I18nWrapper>
      <SettingsPortProvider value={fake.port}>
        <NotificationsSettings testID="notifications" />
      </SettingsPortProvider>
    </I18nWrapper>,
  );
  return fake;
}

const BANNER = "settings-notifications-os-permission-banner";
const toggle = (key: string) => `settings-notifications-${key}-toggle`;

describe("NotificationsSettings", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("shows every row with its wording and no banner while the phone allows notifications", () => {
    renderSection();

    expect(screen.getByText("Allow notifications")).toBeVisible();
    expect(screen.getByText("Total Market Cap")).toBeVisible();
    expect(screen.getByText("Transaction Alerts (Beta)")).toBeVisible();
    expect(screen.queryByTestId(BANNER)).toBeNull();
  });

  it("disables the categories but not Allow notifications while Allow is off", () => {
    renderSection({
      notifications: { ...ALL_NOTIFICATIONS_ON, areNotificationsAllowed: false },
    });

    expect(screen.getByTestId(toggle("areNotificationsAllowed"))).toHaveProp("disabled", false);
    expect(screen.getByTestId(toggle("announcementsCategory"))).toHaveProp("disabled", true);
  });

  it("shows the banner and disables every toggle while the phone blocks notifications", async () => {
    const user = userEvent.setup();
    const { requestOsPermission } = renderSection({ osPermissionAuthorized: false });

    expect(screen.getByTestId(BANNER)).toBeVisible();
    expect(screen.getByText("Notifications are disabled")).toBeVisible();
    expect(screen.getByTestId(toggle("areNotificationsAllowed"))).toHaveProp("disabled", true);
    expect(screen.getByTestId(toggle("totalMarketCap"))).toHaveProp("disabled", true);

    await user.press(screen.getByText("Turn on notifications"));
    expect(requestOsPermission).toHaveBeenCalledTimes(1);
  });

  it("does not render a category hidden remotely", () => {
    renderSection({ hiddenCategories: ["topGainersLosers"] });

    expect(screen.queryByTestId("settings-notifications-topGainersLosers")).toBeNull();
    expect(screen.getByTestId("settings-notifications-largeMoverCategory")).toBeVisible();
  });
});
