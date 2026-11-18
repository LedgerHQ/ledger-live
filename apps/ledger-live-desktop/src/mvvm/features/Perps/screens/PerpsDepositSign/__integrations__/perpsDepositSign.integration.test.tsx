import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { PayloadStepError } from "@ledgerhq/live-common/wallet-api/Exchange/SwapError";
import { act, render, screen } from "tests/testSetup";
import PerpsDepositSignRoot, { openPerpsDepositSign } from "../PerpsDepositSignDialog";
import type { PerpsDepositSignData } from "../usePerpsDepositSignViewModel";

const mockExecuteSwap = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Exchange/executeSwap", () => ({
  executeSwap: (deps: unknown, params: unknown) => mockExecuteSwap(deps, params),
}));

const mockOpenPerpsDeposit = jest.fn();
jest.mock("../../PerpsDeposit/PerpsDepositDialog", () => ({
  openPerpsDeposit: (data: unknown) => mockOpenPerpsDeposit(data),
}));

const mockOpenPerpsReview = jest.fn();
jest.mock("../../PerpsReview/PerpsReviewDialog", () => ({
  openPerpsReview: (data: unknown) => mockOpenPerpsReview(data),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const depositAccount = genAccount("funding-1", { currency: ethereum, operationsSize: 0 });
const receiverAccount = genAccount("receiver-1", { currency: ethereum, operationsSize: 0 });

const signData: PerpsDepositSignData = {
  depositAccount,
  receiverAccount,
  amountSent: "0.02",
  amountTo: "0.019",
  quoteId: "quote-1",
  draft: { depositAccount, depositAmount: 20 },
};

/** A deposit that has begun and is waiting on the first device prompt. */
const pendingSwap = () => new Promise<void>(() => {});

describe("PerpsDepositSign integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteSwap.mockImplementation(pendingSwap);
  });

  it("should not render the signing dialog until a deposit is handed over", () => {
    render(<PerpsDepositSignRoot />);

    expect(screen.queryByTestId("device-action-loader")).not.toBeInTheDocument();
    expect(mockExecuteSwap).not.toHaveBeenCalled();
  });

  it("should start the deposit and wait on it once opened", () => {
    render(<PerpsDepositSignRoot />);

    act(() => openPerpsDepositSign(signData));

    // Nothing is asked of the holder yet, so the dialog holds a spinner.
    expect(screen.getByTestId("device-action-loader")).toBeVisible();
    expect(mockExecuteSwap).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ quoteId: "quote-1", fromAmount: "0.02" }),
    );
  });

  it("should title the dialog for screen readers once a device prompt is reached", () => {
    mockExecuteSwap.mockImplementation(deps => {
      deps.uiHooks["custom.exchange.start"]({
        exchangeParams: { exchangeType: "SWAP" },
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      });
      return pendingSwap();
    });
    render(<PerpsDepositSignRoot />);

    act(() => openPerpsDepositSign(signData));

    expect(screen.getByRole("dialog", { name: "Deposit signing" })).toBeVisible();
    expect(screen.queryByTestId("device-action-loader")).not.toBeInTheDocument();
  });

  it("should offer a retry when the deposit fails, and restart it on retry", async () => {
    mockExecuteSwap.mockRejectedValueOnce(new Error("Device disconnected"));
    const { user } = render(<PerpsDepositSignRoot />);

    act(() => openPerpsDepositSign(signData));

    await user.click(await screen.findByTestId("perps-deposit-sign-retry"));

    expect(mockExecuteSwap).toHaveBeenCalledTimes(2);
  });

  it("should hide a payload failure behind the generic copy, and reopen the form on retry", async () => {
    mockExecuteSwap.mockRejectedValueOnce(new PayloadStepError(new Error("swap api 500")));
    const { user } = render(<PerpsDepositSignRoot />);

    act(() => openPerpsDepositSign(signData));

    expect(await screen.findByText("Something went wrong")).toBeVisible();
    expect(screen.getByText("Please try again later or select a different asset.")).toBeVisible();
    expect(screen.queryByText(/swap api 500|PayloadStepError/)).not.toBeInTheDocument();

    await user.click(screen.getByTestId("perps-deposit-sign-retry"));

    expect(mockOpenPerpsDeposit).toHaveBeenCalledWith({ receiverAccount, draft: signData.draft });
    expect(mockExecuteSwap).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
