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
    Warning: makeIcon("icon-warning"),
    Nano: makeIcon("device-icon-nano"),
    Flex: makeIcon("device-icon-flex"),
    Apex: makeIcon("device-icon-apex"),
    Stax: makeIcon("device-icon-stax"),
  };
});

jest.mock("../components/SyncErrorBottomSheet", () => ({
  SyncErrorBottomSheet: () => null,
}));

describe("TopBarView", () => {
  const onMyLedgerPress = jest.fn();
  const onDiscoverPress = jest.fn();
  const onNotificationsPress = jest.fn();
  const onSettingsPress = jest.fn();

  const openSyncDrawer = jest.fn();
  const closeSyncDrawer = jest.fn();

  const defaultProps = {
    onMyLedgerPress,
    onDiscoverPress,
    onNotificationsPress,
    onSettingsPress,
    hasUnreadNotifications: false,
    hasAccounts: false,
    isSyncError: false,
    isSyncPending: false,
    listOfErrorAccountNames: "",
    syncAccessibilityLabel: "Synchronize",
    isSyncDrawerOpen: false,
    openSyncDrawer,
    closeSyncDrawer,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call expected callbacks when top bar buttons are pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBarView {...defaultProps} />);

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
    const { getByTestId, queryByTestId } = renderWithReactQuery(<TopBarView {...defaultProps} />);

    expect(getByTestId("icon-bell")).toBeVisible();
    expect(queryByTestId("icon-bell-notification")).toBeNull();
  });

  it("should render bell notification icon when there are unread notifications", () => {
    const { getByTestId, queryByTestId } = renderWithReactQuery(
      <TopBarView {...defaultProps} hasUnreadNotifications />,
    );

    expect(getByTestId("icon-bell-notification")).toBeVisible();
    expect(queryByTestId("icon-bell")).toBeNull();
  });

  it("should render sync icon button when there are accounts and sync errors", () => {
    const { getByTestId } = renderWithReactQuery(
      <TopBarView {...defaultProps} hasAccounts isSyncError />,
    );

    expect(getByTestId("topbar-sync")).toBeVisible();
  });

  it("should not render sync icon button when there are no accounts", () => {
    const { queryByTestId } = renderWithReactQuery(
      <TopBarView {...defaultProps} hasAccounts={false} isSyncError />,
    );

    expect(queryByTestId("topbar-sync")).toBeNull();
  });

  it("should not render sync icon button when there are no sync errors", () => {
    const { queryByTestId } = renderWithReactQuery(
      <TopBarView {...defaultProps} hasAccounts isSyncError={false} />,
    );

    expect(queryByTestId("topbar-sync")).toBeNull();
  });
});
