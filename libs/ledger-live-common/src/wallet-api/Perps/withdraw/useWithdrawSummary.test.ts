/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { PerpsWithdrawQuoteParams, WithdrawQuote } from "./quote";
import { usePerpsWithdrawSummary } from "./useWithdrawSummary";

const mockQuoteState = jest.fn();
jest.mock("./useWithdrawSummaryQuote", () => ({
  usePerpsWithdrawSummaryQuote: () => mockQuoteState(),
}));

const quote: WithdrawQuote = {
  quoteId: "quote-1",
  amountTo: new BigNumber("0.3"),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: Date.now() + 60_000,
};

const quoteParams: PerpsWithdrawQuoteParams = {
  amount: "10",
  sourceAccount: genAccount("source-1", {
    currency: getCryptoCurrencyById("hypercore"),
    operationsSize: 0,
  }),
  destinationAccount: genAccount("eth-1", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 0,
  }),
  accounts: [],
  counterValueCurrency: "USD",
};

const renderSummary = (amount = quoteParams.amount) =>
  renderHook(() =>
    usePerpsWithdrawSummary({
      initialQuote: quote,
      quoteParams: { ...quoteParams, amount },
      receiverName: "Ethereum 1",
      locale: "en",
      formatApproximate: value => `~${value}`,
    }),
  ).result.current;

// The formatter separates the value from the ticker with a non-breaking space.
const values = (details: readonly { value: string }[]) =>
  details.map(({ value }) => value.replace(/ /g, " "));

describe("usePerpsWithdrawSummary", () => {
  beforeEach(() => {
    mockQuoteState.mockReturnValue({ quote, isRefreshing: false, error: null });
  });

  it("builds the swap and withdraw rows from the quote", () => {
    const { swapDetails, withdrawDetails, canWithdraw } = renderSummary();

    expect(values(swapDetails)).toEqual(["10 USDC", "~0.3 ETH"]);
    expect(values(withdrawDetails)).toEqual(["Ethereum 1", "0.0004 ETH + 1 USDC", "11 USDC"]);
    expect(canWithdraw).toBe(true);
  });

  it("blocks Withdraw while the quote refreshes or after a failed refresh", () => {
    mockQuoteState.mockReturnValue({ quote, isRefreshing: true, error: null });
    expect(renderSummary().canWithdraw).toBe(false);

    mockQuoteState.mockReturnValue({ quote, isRefreshing: false, error: new Error("no quote") });
    expect(renderSummary().canWithdraw).toBe(false);
  });

  it.each(["", "abc"])("reads an unreadable amount %p as 0 instead of throwing", amount => {
    expect(values(renderSummary(amount).swapDetails)[0]).toBe("0 USDC");
  });
});
