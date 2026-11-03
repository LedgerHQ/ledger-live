/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { renderHook, waitFor } from "@testing-library/react";
import type { PerpsWithdrawQuoteParams, WithdrawQuote } from "./quote";
import { usePerpsWithdrawSummaryQuote } from "./useWithdrawSummaryQuote";

const mockFetchWithdrawQuote = jest.fn();
jest.mock("./quote", () => ({
  PERPS_WITHDRAW_QUOTE_TTL_MS: 50,
  fetchPerpsWithdrawQuote: (params: unknown) => mockFetchWithdrawQuote(params),
}));

const makeQuote = (amountTo: string, expiresIn: number): WithdrawQuote => ({
  quoteId: `quote-${amountTo}`,
  amountTo: new BigNumber(amountTo),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: Date.now() + expiresIn,
});

const params: PerpsWithdrawQuoteParams = {
  amount: "500",
  sourceAccount: { id: "source-1" } as AccountLike,
  destinationAccount: { id: "destination-1" } as AccountLike,
  accounts: [],
  counterValueCurrency: "USD",
};

describe("usePerpsWithdrawSummaryQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the quote from the input without fetching it again", async () => {
    const initialQuote = makeQuote("0.3", 60_000);
    const { result } = renderHook(() => usePerpsWithdrawSummaryQuote(initialQuote, params));

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(result.current).toEqual({ quote: initialQuote, isRefreshing: false, error: null });
    expect(mockFetchWithdrawQuote).not.toHaveBeenCalled();
  });

  it("replaces the quote when it expires", async () => {
    const refreshed = makeQuote("0.31", 60_000);
    mockFetchWithdrawQuote.mockResolvedValue(refreshed);
    const { result } = renderHook(() => usePerpsWithdrawSummaryQuote(makeQuote("0.3", 50), params));

    await waitFor(() => expect(result.current.quote).toBe(refreshed));
    expect(result.current.isRefreshing).toBe(false);
    expect(mockFetchWithdrawQuote).toHaveBeenCalledWith(params);
  });

  it("keeps the previous quote and reports the error when the refresh fails", async () => {
    const initialQuote = makeQuote("0.3", 50);
    const error = new Error("no quote");
    mockFetchWithdrawQuote.mockRejectedValue(error);
    const { result } = renderHook(() => usePerpsWithdrawSummaryQuote(initialQuote, params));

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.quote).toBe(initialQuote);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("retries a failed refresh after the quote TTL", async () => {
    const refreshed = makeQuote("0.31", 60_000);
    mockFetchWithdrawQuote
      .mockRejectedValueOnce(new Error("no quote"))
      .mockResolvedValue(refreshed);
    const { result } = renderHook(() => usePerpsWithdrawSummaryQuote(makeQuote("0.3", 50), params));

    await waitFor(() => expect(result.current.quote).toBe(refreshed));
    expect(result.current.error).toBeNull();
    expect(mockFetchWithdrawQuote).toHaveBeenCalledTimes(2);
  });

  it("does not refresh while disabled", async () => {
    const initialQuote = makeQuote("0.3", 50);
    const { result } = renderHook(() =>
      usePerpsWithdrawSummaryQuote(initialQuote, params, { enabled: false }),
    );

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(mockFetchWithdrawQuote).not.toHaveBeenCalled();
    expect(result.current.quote).toBe(initialQuote);
  });
});
