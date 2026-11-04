import React from "react";
import { Text } from "react-native";
import { renderWithReactQuery } from "@tests/test-renderer";
import { TopBarView } from "../TopBarView/index";

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => {
  const makeIcon = (testID: string) => () => <Text testID={testID}>{testID}</Text>;

  return {
    Compass: makeIcon("icon-compass"),
    Warning: makeIcon("icon-warning"),
    Clock: makeIcon("icon-clock"),
    Search: makeIcon("icon-search"),
    User: makeIcon("my-wallet-avatar"),
  };
});

jest.mock("../components/SyncErrorBottomSheet", () => ({
  SyncErrorBottomSheet: () => null,
}));

describe("TopBarView", () => {
  const onMyWalletPress = jest.fn();
  const onDiscoverPress = jest.fn();
  const onSearchPress = jest.fn();
  const onTransactionHistoryPress = jest.fn();

  const openSyncDrawer = jest.fn();
  const closeSyncDrawer = jest.fn();
  const onTryRefresh = jest.fn();

  const defaultProps = {
    onMyWalletPress,
    shouldDisplayAssetDiscoverability: false,
    onSearchPress,
    onDiscoverPress,
    onTransactionHistoryPress,
    hasUnreadNotifications: false,
    hasUnreadOperations: false,
    hasAccounts: false,
    isSyncError: false,
    isSyncPending: false,
    listOfErrorAccountNames: "",
    syncAccessibilityLabel: "Synchronize",
    isSyncDrawerOpen: false,
    openSyncDrawer,
    closeSyncDrawer,
    onTryRefresh,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call expected callbacks when top bar buttons are pressed", async () => {
    const { user, getByTestId } = renderWithReactQuery(<TopBarView {...defaultProps} />);

    await user.press(getByTestId("topbar-mywallet"));
    await user.press(getByTestId("topbar-discover"));
    await user.press(getByTestId("topbar-transaction-history"));

    expect(onMyWalletPress).toHaveBeenCalledTimes(1);
    expect(onDiscoverPress).toHaveBeenCalledTimes(1);
    expect(onTransactionHistoryPress).toHaveBeenCalledTimes(1);
  });

  it("should not render the search icon when asset discoverability is disabled", () => {
    const { queryByTestId } = renderWithReactQuery(
      <TopBarView {...defaultProps} shouldDisplayAssetDiscoverability={false} />,
    );
    expect(queryByTestId("topbar-search")).toBeNull();
  });

  it("should render the search icon and call onSearchPress when asset discoverability is enabled", async () => {
    const { user, getByTestId } = renderWithReactQuery(
      <TopBarView {...defaultProps} shouldDisplayAssetDiscoverability />,
    );

    const searchIcon = getByTestId("topbar-search");
    expect(searchIcon).toBeVisible();

    await user.press(searchIcon);
    expect(onSearchPress).toHaveBeenCalledTimes(1);
  });

  it("should show transaction history in the trailing icons and discover in the leading icons", () => {
    const { queryByTestId, getByTestId } = renderWithReactQuery(<TopBarView {...defaultProps} />);
    expect(getByTestId("topbar-mywallet")).toBeVisible();
    expect(getByTestId("topbar-discover")).toBeVisible();
    expect(getByTestId("topbar-transaction-history")).toBeVisible();
    expect(queryByTestId("topbar-notifications")).toBeNull();
    expect(queryByTestId("topbar-settings")).toBeNull();
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
