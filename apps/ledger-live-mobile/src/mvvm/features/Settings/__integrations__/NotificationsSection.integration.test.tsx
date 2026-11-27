import React from "react";
import { Linking } from "react-native";
import Braze from "@braze/react-native-sdk";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { track, trackPage } from "@shared/analytics";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import SettingsNavigator from "~/components/RootNavigator/SettingsNavigator";
import { trackWithRoute } from "~/analytics";
import type { NotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import type { State } from "~/reducers/types";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

// The jest setup replaces the segment module without trackWithRoute, which the banner action calls.
jest.mock("~/analytics/segment", () => ({
  setAnalyticsFeatureFlagMethod: jest.fn(),
  usePageNameFromRoute: jest.fn(() => "portfolio_navigator"),
  trackWithRoute: jest.fn(),
}));

const BANNER = "settings-notifications-os-permission-banner";
const toggle = (key: string) => `settings-notifications-${key}-toggle`;

type Setup = Readonly<{
  permissionStatus: NotificationPermissionStatus;
  notifications?: Partial<State["settings"]["notifications"]>;
  hiddenCategories?: readonly string[];
}>;

async function openNotificationsSection({
  permissionStatus,
  notifications = {},
  hiddenCategories = [],
}: Setup) {
  const rendered = render(<SettingsNavigator />, {
    overrideInitialState: withFlagOverrides(
      {
        newSettings: { enabled: true },
        brazePushNotifications: {
          enabled: true,
          params: {
            notificationsCategories: hiddenCategories.map(category => ({
              category,
              displayed: false,
            })),
          },
        },
      },
      state => ({
        ...state,
        settings: {
          ...state.settings,
          notifications: { ...state.settings.notifications, ...notifications },
        },
        notifications: { ...state.notifications, permissionStatus },
      }),
    ),
  });

  await rendered.user.press(await screen.findByTestId("settings-home-notifications"));
  expect(await screen.findByTestId("settings-section-notifications")).toBeVisible();

  return rendered;
}

describe("Settings › Notifications section", () => {
  beforeEach(() => {
    jest.mocked(track).mockClear();
    jest.mocked(trackPage).mockClear();
    jest.mocked(Braze.setCustomUserAttribute).mockClear();
  });

  it("tracks the Notifications page like the legacy screen", async () => {
    await openNotificationsSection({ permissionStatus: AuthorizationStatus.AUTHORIZED });

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Settings", name: "Notifications" }),
      expect.anything(),
    );
  });

  it("shows the stored values and no banner while the phone allows notifications", async () => {
    await openNotificationsSection({
      permissionStatus: AuthorizationStatus.AUTHORIZED,
      notifications: { areNotificationsAllowed: true, largeMoverCategory: false },
    });

    expect(screen.queryByTestId(BANNER)).toBeNull();
    expect(screen.getByTestId(toggle("largeMoverCategory"))).not.toBeChecked();
    expect(screen.getByTestId(toggle("areNotificationsAllowed"))).toBeChecked();
  });

  it("stores a change, tracks the legacy toggle and updates the marketing tool", async () => {
    const { user, store } = await openNotificationsSection({
      permissionStatus: AuthorizationStatus.AUTHORIZED,
      notifications: { areNotificationsAllowed: true, largeMoverCategory: true },
    });

    await user.press(screen.getByTestId(toggle("largeMoverCategory")));

    expect(store.getState().settings.notifications.largeMoverCategory).toBe(false);
    expect(track).toHaveBeenCalledWith("toggle_clicked", {
      toggle: "Toggle_Largemover",
      enabled: false,
    });
    expect(Braze.setCustomUserAttribute).toHaveBeenCalledWith("optInLargeMovers", false);
  });

  it("marks the user as opted out and tells the marketing tool when Allow notifications is turned off", async () => {
    const { user, store } = await openNotificationsSection({
      permissionStatus: AuthorizationStatus.AUTHORIZED,
      notifications: { areNotificationsAllowed: true },
    });
    const dataOfUserBefore = store.getState().notifications.dataOfUser;

    await user.press(screen.getByTestId(toggle("areNotificationsAllowed")));

    expect(store.getState().settings.notifications.areNotificationsAllowed).toBe(false);
    expect(store.getState().notifications.dataOfUser).not.toEqual(dataOfUserBefore);
    expect(Braze.setCustomUserAttribute).toHaveBeenCalledWith("notificationsAllowed", false);
    expect(track).toHaveBeenCalledWith("toggle_clicked", {
      toggle: "Toggle_Allow",
      enabled: false,
    });
    expect(screen.getByTestId(toggle("announcementsCategory"))).toBeDisabled();
  });

  it("shows the banner and disables every toggle while the phone blocks notifications", async () => {
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    const { user, store } = await openNotificationsSection({
      permissionStatus: AuthorizationStatus.DENIED,
      notifications: { areNotificationsAllowed: true },
    });

    expect(screen.getByTestId(BANNER)).toBeVisible();
    expect(screen.getByTestId(toggle("areNotificationsAllowed"))).toBeDisabled();
    expect(screen.getByTestId(toggle("announcementsCategory"))).toBeDisabled();

    await user.press(screen.getByTestId(toggle("announcementsCategory")));
    expect(store.getState().settings.notifications.announcementsCategory).toBe(true);

    await user.press(screen.getByText("Turn on notifications"));

    expect(trackWithRoute).toHaveBeenCalledWith("button_clicked", expect.anything(), {
      button: "Go to system settings",
    });
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it("hides a category hidden remotely", async () => {
    await openNotificationsSection({
      permissionStatus: AuthorizationStatus.AUTHORIZED,
      hiddenCategories: ["topGainersLosers"],
    });

    expect(screen.queryByTestId("settings-notifications-topGainersLosers")).toBeNull();
    expect(screen.getByTestId("settings-notifications-totalMarketCap")).toBeVisible();
  });
});
