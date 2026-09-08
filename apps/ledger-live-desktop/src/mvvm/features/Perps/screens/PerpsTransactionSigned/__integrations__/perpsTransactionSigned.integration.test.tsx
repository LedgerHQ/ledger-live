import React from "react";
import { act, render, screen } from "tests/testSetup";
import PerpsTransactionSignedRoot, {
  openPerpsTransactionSigned,
} from "../PerpsTransactionSignedDialog";
import type { PerpsTransactionSignedData } from "../usePerpsTransactionSignedViewModel";

const mockOpenSwapTransactionStatusDialog = jest.fn((_params: unknown) => ({
  type: "swap/openTransactionStatus",
}));
jest.mock("LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog", () => ({
  openSwapTransactionStatusDialog: (params: unknown) => mockOpenSwapTransactionStatusDialog(params),
}));

const signedData: PerpsTransactionSignedData = {
  receiveCurrencyTicker: "USDC",
  swapId: "swap-1",
  provider: "swapkit_hyperliquid",
};

describe("PerpsTransactionSigned integration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should not render the confirmation until a deposit is signed", () => {
    render(<PerpsTransactionSignedRoot />);

    expect(screen.queryByTestId("perps-transaction-signed-cta")).not.toBeInTheDocument();
  });

  it("should name the currency the holder is waiting on once opened", () => {
    render(<PerpsTransactionSignedRoot />);

    act(() => openPerpsTransactionSigned(signedData));

    expect(screen.getByText("Transaction signed")).toBeVisible();
    expect(screen.getByText(/USDC/)).toBeVisible();
    expect(screen.getByTestId("perps-transaction-signed-cta")).toBeEnabled();
  });

  it("should follow the deposit swap when the transaction is opened", async () => {
    const { user } = render(<PerpsTransactionSignedRoot />);

    act(() => openPerpsTransactionSigned(signedData));
    await user.click(screen.getByTestId("perps-transaction-signed-cta"));

    // The deposit is funded by a swap, so its status is where the holder follows it.
    expect(mockOpenSwapTransactionStatusDialog).toHaveBeenCalledWith({
      swapId: "swap-1",
      provider: "swapkit_hyperliquid",
      origin: "perps",
    });
    expect(screen.queryByTestId("perps-transaction-signed-cta")).not.toBeInTheDocument();
  });
});
