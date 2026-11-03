import React from "react";
import { render } from "@tests/test-renderer";
import { SwapTopBarHeader } from "../SwapTopBarHeader";
import { useSwapTopBarHeaderViewModel } from "../useSwapTopBarHeaderViewModel";

jest.mock("../useSwapTopBarHeaderViewModel", () => ({
  useSwapTopBarHeaderViewModel: jest.fn(),
}));

const mockedUseSwapTopBarHeaderViewModel = jest.mocked(useSwapTopBarHeaderViewModel);

const baseViewModel: ReturnType<typeof useSwapTopBarHeaderViewModel> = {
  onMyWalletPress: jest.fn(),
  hasUnreadNotifications: false,
  onSwapHistoryPress: jest.fn(),
  hasAccounts: false,
  isSyncError: false,
  isSyncPending: false,
  listOfErrorAccountNames: "",
  syncAccessibilityLabel: "Synchronize",
  isSyncDrawerOpen: false,
  openSyncDrawer: jest.fn(),
  closeSyncDrawer: jest.fn(),
  onTryRefresh: jest.fn(),
};

describe("SwapTopBarHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger my wallet and swap history actions", async () => {
    const onMyWalletPress = jest.fn();
    const onSwapHistoryPress = jest.fn();

    mockedUseSwapTopBarHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      onMyWalletPress,
      hasUnreadNotifications: false,
      onSwapHistoryPress,
    });

    const { user, getByTestId, queryByTestId } = render(<SwapTopBarHeader />);

    expect(queryByTestId("topbar-myledger")).toBeNull();

    await user.press(getByTestId("topbar-mywallet"));
    await user.press(getByTestId("topbar-swap-history"));

    expect(onMyWalletPress).toHaveBeenCalledTimes(1);
    expect(onSwapHistoryPress).toHaveBeenCalledTimes(1);
  });

  it("should render My Wallet with notifications when there are unread notifications", async () => {
    const onMyWalletPress = jest.fn();
    const onSwapHistoryPress = jest.fn();

    mockedUseSwapTopBarHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      onMyWalletPress,
      hasUnreadNotifications: true,
      onSwapHistoryPress,
    });

    const { user, getByTestId } = render(<SwapTopBarHeader />);

    await user.press(getByTestId("topbar-mywallet"));
    await user.press(getByTestId("topbar-swap-history"));

    expect(onMyWalletPress).toHaveBeenCalledTimes(1);
    expect(onSwapHistoryPress).toHaveBeenCalledTimes(1);
  });
});
