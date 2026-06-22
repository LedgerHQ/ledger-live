import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import {
  closeSwapTransactionStatusDialog,
  openSwapTransactionStatusDialog,
} from "../swapTransactionStatusDialog";
import { useSwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";
import type { SwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";
import SwapTransactionStatusDialog from "..";

jest.mock("../hooks/useSwapTransactionStatusViewModel", () => ({
  useSwapTransactionStatusViewModel: jest.fn(),
}));

const mockedUseSwapTransactionStatusViewModel = jest.mocked(useSwapTransactionStatusViewModel);

const loadingViewModel: SwapTransactionStatusViewModel = {
  createdAt: undefined,
  explorerUrl: undefined,
  feesAmount: undefined,
  isFooterLoading: true,
  isStatusSectionLoading: true,
  locale: "en-US",
  provider: "lifi",
  providerData: undefined,
  receiveAccountCurrency: undefined,
  receiveAccountName: undefined,
  receivedAmount: undefined,
  receiveCurrency: undefined,
  receiveStatus: "pending",
  sendCurrency: undefined,
  sendStatus: "pending",
  sentAmount: undefined,
  swapId: "swap-1",
};

function useViewModelWithMountedSwapId({
  provider,
  swapId,
}: Parameters<typeof useSwapTransactionStatusViewModel>[0]): SwapTransactionStatusViewModel {
  const mountedSwapId = React.useRef(swapId);

  return {
    ...loadingViewModel,
    isFooterLoading: true,
    isStatusSectionLoading: true,
    provider,
    swapId: mountedSwapId.current,
  };
}

describe("SwapTransactionStatusDialog Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSwapTransactionStatusViewModel.mockReturnValue(loadingViewModel);
  });

  it("should open and close from Redux state", async () => {
    const { store } = render(<SwapTransactionStatusDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => {
      store.dispatch(openSwapTransactionStatusDialog({ swapId: "swap-1", provider: "lifi" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    act(() => {
      store.dispatch(closeSwapTransactionStatusDialog());
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should render transaction status content from the dialog view model", async () => {
    mockedUseSwapTransactionStatusViewModel.mockReturnValue({
      ...loadingViewModel,
      explorerUrl: "https://scan.swaps.xyz/transactions/swap-1",
      isFooterLoading: false,
      isStatusSectionLoading: false,
      provider: "moonpay_trade",
      receiveStatus: "unknown",
      sendStatus: "refunded",
    });
    const { store } = render(<SwapTransactionStatusDialog />);

    act(() => {
      store.dispatch(
        openSwapTransactionStatusDialog({ swapId: "swap-1", provider: "moonpay_trade" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });
    expect(screen.getByText("Refunded")).toBeVisible();
    expect(screen.getByText("Unknown")).toBeVisible();
    expect(screen.getByText("MoonPay Trade")).toBeVisible();
    expect(screen.getByRole("button", { name: "View in explorer" })).toBeVisible();
  });

  it("should remount transaction content when opening another swap while already open", async () => {
    mockedUseSwapTransactionStatusViewModel.mockImplementation(useViewModelWithMountedSwapId);
    const { store } = render(<SwapTransactionStatusDialog />);

    act(() => {
      store.dispatch(openSwapTransactionStatusDialog({ swapId: "swap-1", provider: "lifi" }));
    });

    await waitFor(() => {
      expect(screen.getByText("swap-1")).toBeVisible();
    });

    act(() => {
      store.dispatch(openSwapTransactionStatusDialog({ swapId: "swap-2", provider: "lifi" }));
    });

    await waitFor(() => {
      expect(screen.getByText("swap-2")).toBeVisible();
    });
    expect(screen.queryByText("swap-1")).not.toBeInTheDocument();
  });
});
