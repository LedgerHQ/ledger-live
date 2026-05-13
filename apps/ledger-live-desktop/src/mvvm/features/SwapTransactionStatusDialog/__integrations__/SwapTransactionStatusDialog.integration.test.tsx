import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import {
  closeSwapTransactionStatusDialog,
  openSwapTransactionStatusDialog,
} from "~/renderer/reducers/swapTransactionStatusDialog";
import { useSwapTransactionStatus } from "../hooks/useSwapTransactionStatus";
import type { SwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatus";
import SwapTransactionStatusDialog from "..";

jest.mock("../hooks/useSwapTransactionStatus", () => ({
  useSwapTransactionStatus: jest.fn(),
}));

const mockedUseSwapTransactionStatus = jest.mocked(useSwapTransactionStatus);

const loadingViewModel: SwapTransactionStatusViewModel = {
  phase: "polling_hidden",
  latestStatus: undefined,
  details: undefined,
  isInitialLoading: true,
  isSettled: false,
};

describe("SwapTransactionStatusDialog Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSwapTransactionStatus.mockReturnValue(loadingViewModel);
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
    mockedUseSwapTransactionStatus.mockReturnValue({
      phase: "settled_visible",
      latestStatus: {
        provider: "moonpay_trade",
        swapId: "swap-1",
        status: "refunded",
      },
      details: {
        provider: "moonpay_trade",
        swapId: "swap-1",
        status: "refunded",
        sendStatus: "refunded",
        receiveStatus: "unknown",
      } as SwapTransactionStatusViewModel["details"],
      isInitialLoading: false,
      isSettled: true,
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
});
