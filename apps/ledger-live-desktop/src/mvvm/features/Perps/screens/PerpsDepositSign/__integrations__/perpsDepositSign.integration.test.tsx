import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { act, render, screen } from "tests/testSetup";
import PerpsDepositSignRoot, { openPerpsDepositSign } from "../PerpsDepositSignDialog";
import type { PerpsDepositSignData } from "../usePerpsDepositSignViewModel";

const mockExecuteSwap = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Exchange/executeSwap", () => ({
  executeSwap: (deps: unknown, params: unknown) => mockExecuteSwap(deps, params),
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
});
