import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import type { WithdrawQuote } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/quote";
import { act, render, screen } from "tests/testSetup";
import PerpsWithdrawSummaryRoot, { openPerpsWithdrawSummary } from "../PerpsWithdrawSummaryDialog";
import type { PerpsWithdrawSummaryData } from "../usePerpsWithdrawSummaryViewModel";

const mockOpenPerpsWithdraw = jest.fn();
jest.mock("../../PerpsWithdraw/PerpsWithdrawDialog", () => ({
  openPerpsWithdraw: (data: unknown) => mockOpenPerpsWithdraw(data),
}));

const mockCancelWithdrawRequest = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/request", () => ({
  cancelWithdrawRequest: () => mockCancelWithdrawRequest(),
}));

const mockUseSummaryQuote = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/useWithdrawSummaryQuote", () => ({
  usePerpsWithdrawSummaryQuote: (initialQuote: unknown, params: unknown) =>
    mockUseSummaryQuote(initialQuote, params),
}));

function createAccount(id: string, currencyId: string): Account {
  return genAccount(id, { currency: getCryptoCurrencyById(currencyId), operationsSize: 0 });
}

const sourceAccount = createAccount("source-1", "hypercore");
const destinationAccount = createAccount("eth-1", "ethereum");

const quote: WithdrawQuote = {
  quoteId: "quote-1",
  amountTo: new BigNumber("0.3"),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: 1792000000000,
};

const summaryData: PerpsWithdrawSummaryData = {
  sourceAccount,
  destinationAccount,
  quote,
  quoteParams: {
    amount: "10",
    sourceAccount,
    destinationAccount,
    accounts: [sourceAccount, destinationAccount],
    counterValueCurrency: "USD",
  },
  draft: { picked: { account: destinationAccount }, amountText: "20" },
};

function renderSummary() {
  const rendered = render(<PerpsWithdrawSummaryRoot />);
  act(() => openPerpsWithdrawSummary(summaryData));
  return rendered;
}

const withdrawCta = () => screen.getByTestId("perps-withdraw-cta");

describe("PerpsWithdrawSummary integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSummaryQuote.mockReturnValue({ quote, isRefreshing: false, error: null });
  });

  it("should not render until a withdrawal is reviewed", () => {
    render(<PerpsWithdrawSummaryRoot />);

    expect(screen.queryByTestId("perps-withdraw-cta")).not.toBeInTheDocument();
  });

  it("should show what is sent, what is received and what leaves the Perps balance", () => {
    renderSummary();

    expect(screen.getByRole("dialog", { name: "Withdraw via SwapKit" })).toBeVisible();
    expect(screen.getByTestId("perps-withdraw-amount-sent")).toHaveTextContent(/10\s?USDC/);
    // The received amount is a quote, net of every fee, so it reads as an estimate.
    expect(screen.getByTestId("perps-withdraw-amount-received")).toHaveTextContent(/~0\.3\s?ETH/);
    expect(screen.getByTestId("perps-withdraw-receiver-account")).toBeVisible();
    expect(screen.getByTestId("perps-withdraw-network-fees")).toHaveTextContent(
      /0\.0004\s?ETH \+ 1\s?USDC/,
    );
    // The Hyperliquid fee is charged on top of the amount.
    expect(screen.getByTestId("perps-withdraw-total-debited")).toHaveTextContent(/11\s?USDC/);
    expect(withdrawCta()).toBeEnabled();
  });

  it("should refresh the quote from the input with the signed USDC amount", () => {
    renderSummary();

    expect(mockUseSummaryQuote).toHaveBeenCalledWith(quote, summaryData.quoteParams);
  });

  it("should show the refreshed quote", () => {
    mockUseSummaryQuote.mockReturnValue({
      quote: { ...quote, amountTo: new BigNumber("0.31") },
      isRefreshing: false,
      error: null,
    });
    renderSummary();

    expect(screen.getByTestId("perps-withdraw-amount-received")).toHaveTextContent(/~0\.31\s?ETH/);
  });

  it("should not allow Withdraw while the quote refreshes or after it failed", () => {
    mockUseSummaryQuote.mockReturnValue({ quote, isRefreshing: true, error: null });
    const { unmount } = renderSummary();
    expect(withdrawCta()).toBeDisabled();
    unmount();

    mockUseSummaryQuote.mockReturnValue({
      quote,
      isRefreshing: false,
      error: new Error("no quote"),
    });
    renderSummary();
    expect(withdrawCta()).toBeDisabled();
  });

  it("should hand the draft back to the input when going back", async () => {
    const { user } = renderSummary();

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(mockOpenPerpsWithdraw).toHaveBeenCalledWith({
      sourceAccount,
      draft: summaryData.draft,
    });
    expect(mockCancelWithdrawRequest).not.toHaveBeenCalled();
    expect(screen.queryByTestId("perps-withdraw-cta")).not.toBeInTheDocument();
  });

  it("should end the withdrawal when closed", async () => {
    const { user } = renderSummary();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(mockCancelWithdrawRequest).toHaveBeenCalled();
    expect(mockOpenPerpsWithdraw).not.toHaveBeenCalled();
    expect(screen.queryByTestId("perps-withdraw-cta")).not.toBeInTheDocument();
  });
});
