import React from "react";
import { render } from "@tests/test-renderer";
import { SwapTopBarHeader } from "../SwapTopBarHeader";
import { useSwapTopBarHeaderViewModel } from "../useSwapTopBarHeaderViewModel";

jest.mock("../useSwapTopBarHeaderViewModel", () => ({
  useSwapTopBarHeaderViewModel: jest.fn(),
}));

const mockedUseSwapTopBarHeaderViewModel = jest.mocked(useSwapTopBarHeaderViewModel);

const baseViewModel: ReturnType<typeof useSwapTopBarHeaderViewModel> = {
  onMyLedgerPress: jest.fn(),
  onMyWalletPress: jest.fn(),
  shouldDisplayMyWallet: false,
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

  it("should trigger my ledger and swap history actions", async () => {
    const onMyLedgerPress = jest.fn();
    const onSwapHistoryPress = jest.fn();

    mockedUseSwapTopBarHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      onMyLedgerPress,
      shouldDisplayMyWallet: false,
      hasUnreadNotifications: false,
      onSwapHistoryPress,
    });

    const { user, getByTestId } = render(<SwapTopBarHeader />);

    await user.press(getByTestId("topbar-myledger"));
    await user.press(getByTestId("topbar-swap-history"));

    expect(onMyLedgerPress).toHaveBeenCalledTimes(1);
    expect(onSwapHistoryPress).toHaveBeenCalledTimes(1);
  });

  it("should trigger my wallet and swap history when My Wallet feature is enabled", async () => {
    const onMyWalletPress = jest.fn();
    const onSwapHistoryPress = jest.fn();

    mockedUseSwapTopBarHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      onMyWalletPress,
      shouldDisplayMyWallet: true,
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

  it("should not show My Wallet when the feature flag is off", () => {
    mockedUseSwapTopBarHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      shouldDisplayMyWallet: false,
      hasUnreadNotifications: true,
    });

    const { queryByTestId } = render(<SwapTopBarHeader />);

    expect(queryByTestId("topbar-mywallet")).toBeNull();
  });

  it("should render My Wallet with notifications when enabled and unread", async () => {
    const onMyWalletPress = jest.fn();
    const onSwapHistoryPress = jest.fn();

    mockedUseSwapTopBarHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      onMyWalletPress,
      shouldDisplayMyWallet: true,
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
