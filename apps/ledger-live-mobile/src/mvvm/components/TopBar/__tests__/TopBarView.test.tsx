import React from "react";
import { Text } from "react-native";
import { renderWithReactQuery } from "@tests/test-renderer";
import { TopBarView } from "../TopBarView/index";

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => {
  const makeIcon = (testID: string) => () => <Text testID={testID}>{testID}</Text>;

  return {
    Compass: makeIcon("icon-compass"),
    Bell: makeIcon("icon-bell"),
    BellNotification: makeIcon("icon-bell-notification"),
    Settings: makeIcon("icon-settings"),
    Nano: makeIcon("device-icon-nano"),
    Flex: makeIcon("device-icon-flex"),
    Apex: makeIcon("device-icon-apex"),
    Stax: makeIcon("device-icon-stax"),
  };
});

describe("TopBarView", () => {
  const onMyLedgerPress = jest.fn();
  const onDiscoverPress = jest.fn();
  const onNotificationsPress = jest.fn();
  const onSettingsPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call expected callbacks when top bar buttons are pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(
      <TopBarView
        onMyLedgerPress={onMyLedgerPress}
        onDiscoverPress={onDiscoverPress}
        onNotificationsPress={onNotificationsPress}
        onSettingsPress={onSettingsPress}
        hasUnreadNotifications={false}
      />,
    );

    await user.press(getByTestId("topbar-myledger"));
    await user.press(getByTestId("topbar-discover"));
    await user.press(getByTestId("topbar-notifications"));
    await user.press(getByTestId("topbar-settings"));

    expect(onMyLedgerPress).toHaveBeenCalledTimes(1);
    expect(onDiscoverPress).toHaveBeenCalledTimes(1);
    expect(onNotificationsPress).toHaveBeenCalledTimes(1);
    expect(onSettingsPress).toHaveBeenCalledTimes(1);
  });

  it("should render bell icon when there are no unread notifications", () => {
    const { getByTestId, queryByTestId } = renderWithReactQuery(
      <TopBarView
        onMyLedgerPress={onMyLedgerPress}
        onDiscoverPress={onDiscoverPress}
        onNotificationsPress={onNotificationsPress}
        onSettingsPress={onSettingsPress}
        hasUnreadNotifications={false}
      />,
    );

    expect(getByTestId("icon-bell")).toBeTruthy();
    expect(queryByTestId("icon-bell-notification")).toBeNull();
  });

  it("should render bell notification icon when there are unread notifications", () => {
    const { getByTestId, queryByTestId } = renderWithReactQuery(
      <TopBarView
        onMyLedgerPress={onMyLedgerPress}
        onDiscoverPress={onDiscoverPress}
        onNotificationsPress={onNotificationsPress}
        onSettingsPress={onSettingsPress}
        hasUnreadNotifications
      />,
    );

    expect(getByTestId("icon-bell-notification")).toBeTruthy();
    expect(queryByTestId("icon-bell")).toBeNull();
  });
});
