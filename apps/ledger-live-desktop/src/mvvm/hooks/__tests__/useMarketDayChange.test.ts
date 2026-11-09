import { renderHook } from "@testing-library/react";
import type { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "@ledgerhq/live-common/market/utils/timers";
import { useMarketDayChange } from "../useMarketDayChange";

const mockUseGetMarketsByLedgerIdsQuery = jest.fn();
const mockResolveCounterCurrency = jest.fn();
const mockHeldCurrencies = jest.fn<{ id: string; ticker: string }[], []>(() => []);

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  useGetMarketsByLedgerIdsQuery: (...args: unknown[]) => mockUseGetMarketsByLedgerIdsQuery(...args),
}));

jest.mock("@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency", () => ({
  useResolveMarketCounterCurrency: (...args: unknown[]) => mockResolveCounterCurrency(...args),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getAccountCurrency: (account: { currency: unknown }) => account.currency,
}));

jest.mock("LLD/hooks/redux", () => ({
  useSelector: (selector: unknown) =>
    selector === jest.requireMock("~/renderer/reducers/accounts").flattenAccountsSelector
      ? mockHeldCurrencies().map(currency => ({ currency }))
      : { ticker: "EUR", type: "FiatCurrency" },
}));

jest.mock("~/renderer/reducers/accounts", () => ({ flattenAccountsSelector: jest.fn() }));
jest.mock("~/renderer/reducers/settings", () => ({ counterValueCurrencySelector: jest.fn() }));

function market(id: string, ticker: string, priceChangePercentage24h: number): MarketItemResponse {
  return { id, ticker, ledgerIds: [id], priceChangePercentage24h } as MarketItemResponse;
}

describe("useMarketDayChange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeldCurrencies.mockReturnValue([]);
    mockUseGetMarketsByLedgerIdsQuery.mockReturnValue({ currentData: undefined });
    mockResolveCounterCurrency.mockReturnValue({
      requestCounterCurrency: "eur",
      isResolutionLoading: false,
    });
  });

  it("should ask /v3/markets once for every held currency, sorted and deduplicated", () => {
    mockHeldCurrencies.mockReturnValue([
      { id: "ethereum", ticker: "ETH" },
      { id: "bitcoin", ticker: "BTC" },
      { id: "ethereum", ticker: "ETH" },
    ]);
    mockUseGetMarketsByLedgerIdsQuery.mockReturnValue({
      currentData: [market("bitcoin", "btc", 1.4), market("ethereum", "eth", -5.42)],
    });

    const { result } = renderHook(() => useMarketDayChange());

    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledTimes(1);
    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledWith(
      { ledgerIds: ["bitcoin", "ethereum"], counterCurrency: "eur" },
      {
        skip: false,
        pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
        skipPollingIfUnfocused: true,
      },
    );
    expect(result.current.byLedgerId.get("ethereum")).toBe(-5.42);
    expect(result.current.byMarketId.get("bitcoin")).toBe(1.4);
  });

  it("should request the counter currency the market API supports", () => {
    mockHeldCurrencies.mockReturnValue([{ id: "bitcoin", ticker: "BTC" }]);
    mockResolveCounterCurrency.mockReturnValue({
      requestCounterCurrency: "usd",
      isResolutionLoading: false,
    });

    renderHook(() => useMarketDayChange());

    expect(mockResolveCounterCurrency).toHaveBeenCalledWith({
      counterCurrency: "EUR",
      isCryptoCountervalue: false,
    });
    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledWith(
      { ledgerIds: ["bitcoin"], counterCurrency: "usd" },
      expect.objectContaining({ skip: false }),
    );
  });

  it("should wait for the counter currency resolution", () => {
    mockHeldCurrencies.mockReturnValue([{ id: "bitcoin", ticker: "BTC" }]);
    mockResolveCounterCurrency.mockReturnValue({
      requestCounterCurrency: "eur",
      isResolutionLoading: true,
    });

    renderHook(() => useMarketDayChange());

    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it("should not query without accounts", () => {
    const { result } = renderHook(() => useMarketDayChange());

    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledWith(
      { ledgerIds: [], counterCurrency: "eur" },
      expect.objectContaining({ skip: true }),
    );
    expect(result.current.byLedgerId.size).toBe(0);
    expect(result.current.byMarketId.size).toBe(0);
  });
});
