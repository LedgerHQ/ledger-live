import { renderHook } from "@testing-library/react";
import { useCardCashback } from "../hooks/useCardCashback";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

const mockGetCardCashback = jest.fn();

jest.mock("@domain/api-card-management", () => ({
  useGetCardCashbackQuery: (...args: unknown[]) => mockGetCardCashback(...args),
}));

const cashback = {
  amount: "0.00294697",
  currency: "BTC",
  network: "bitcoin",
  ratePercent: "1",
  ledgerId: "bitcoin",
};

const { ledgerId: _ledgerId, ...unmappedCashback } = cashback;

const bitcoin = { id: "bitcoin", ticker: "BTC" } as unknown as CryptoOrTokenCurrency;

const currencies = new Map([["bitcoin", bitcoin]]);

function stubQuery(result: Readonly<{ data?: unknown; isLoading?: boolean; isError?: boolean }>) {
  // A fresh object per call: a shared one would make the stability assertion below pass for free.
  mockGetCardCashback.mockImplementation(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    ...result,
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useCardCashback", () => {
  it("does not read the cashback while skipped", () => {
    stubQuery({});

    renderHook(() => useCardCashback({ currencies, skip: true }));

    expect(mockGetCardCashback).toHaveBeenCalledWith(undefined, { skip: true });
  });

  it.each([
    ["loading", { isLoading: true }],
    ["failed", { isError: true }],
  ])("has no cashback while the read is %s", (_name, state) => {
    stubQuery(state);

    const { result } = renderHook(() => useCardCashback({ currencies }));

    expect(result.current).toEqual({ isLoading: false, isError: false, ...state });
    expect(result.current).not.toHaveProperty("cashback");
  });

  it("attaches the currency the host resolved for the cashback's asset", () => {
    stubQuery({ data: cashback });

    const { result } = renderHook(() => useCardCashback({ currencies }));

    expect(result.current.cashback).toEqual({ ...cashback, ledgerCurrency: bitcoin });
  });

  it.each([
    ["the catalog does not map the asset", unmappedCashback],
    ["the host has not resolved the currency yet", { ...cashback, ledgerId: "dogecoin" }],
  ])("leaves the currency off when %s", (_name, data) => {
    stubQuery({ data });

    const { result } = renderHook(() => useCardCashback({ currencies }));

    // Absent rather than `undefined`, so a present key always means a resolved asset.
    expect(result.current.cashback).not.toHaveProperty("ledgerCurrency");
    expect(result.current.cashback?.amount).toBe(cashback.amount);
  });

  it("keeps the same answer across renders while nothing changed", () => {
    stubQuery({ data: cashback });

    const { result, rerender } = renderHook(() => useCardCashback({ currencies }));
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
