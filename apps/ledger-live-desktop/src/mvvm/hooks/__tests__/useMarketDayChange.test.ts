import { renderHook } from "@testing-library/react";
import type { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "@ledgerhq/live-common/market/utils/timers";
import {
  countervalueChangeFromDayPercent,
  marketDayChangeByLedgerId,
  marketDayChangeByMarketId,
  useMarketDayChange,
} from "../useMarketDayChange";

const mockUseGetMarketsByLedgerIdsQuery = jest.fn();
const mockHeldCurrencyIds = jest.fn<string[], []>(() => []);

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/api"),
  useGetMarketsByLedgerIdsQuery: (...args: unknown[]) => mockUseGetMarketsByLedgerIdsQuery(...args),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getAccountCurrency: (account: { currencyId: string }) => ({ id: account.currencyId }),
}));

jest.mock("LLD/hooks/redux", () => ({
  useSelector: (selector: unknown) =>
    selector === jest.requireMock("~/renderer/reducers/accounts").flattenAccountsSelector
      ? mockHeldCurrencyIds().map(currencyId => ({ currencyId }))
      : { ticker: "USD" },
}));

jest.mock("~/renderer/reducers/accounts", () => ({ flattenAccountsSelector: jest.fn() }));
jest.mock("~/renderer/reducers/settings", () => ({ counterValueCurrencySelector: jest.fn() }));

function market(
  id: string,
  ledgerIds: string[],
  priceChangePercentage24h: number | null,
): MarketItemResponse {
  return { id, ledgerIds, priceChangePercentage24h } as MarketItemResponse;
}

describe("marketDayChangeByLedgerId", () => {
  it("should map the 24h change onto each requested ledger id", () => {
    const change = marketDayChangeByLedgerId(
      [market("bitcoin", ["bitcoin"], 1.4), market("tether", ["ethereum/erc20/usd_tether"], -0.02)],
      ["bitcoin", "ethereum/erc20/usd_tether"],
    );

    expect(change.get("bitcoin")).toBe(1.4);
    expect(change.get("ethereum/erc20/usd_tether")).toBe(-0.02);
  });

  it("should keep a zero change", () => {
    const change = marketDayChangeByLedgerId([market("bitcoin", ["bitcoin"], 0)], ["bitcoin"]);

    expect(change.get("bitcoin")).toBe(0);
  });

  it("should prefer the market whose id is the ledger id", () => {
    const change = marketDayChangeByLedgerId(
      [market("wrapped-bitcoin", ["bitcoin"], 9), market("bitcoin", ["bitcoin"], 1.4)],
      ["bitcoin"],
    );

    expect(change.get("bitcoin")).toBe(1.4);
  });

  it("should skip a ledger id with no finite change", () => {
    const change = marketDayChangeByLedgerId(
      [market("bitcoin", ["bitcoin"], null)],
      ["bitcoin", "missing"],
    );

    expect(change.has("bitcoin")).toBe(false);
    expect(change.has("missing")).toBe(false);
  });
});

describe("marketDayChangeByMarketId", () => {
  it("should key the 24h change by market id", () => {
    const change = marketDayChangeByMarketId([
      market("ethereum", ["ethereum"], -5.42),
      market("weth", ["ethereum/erc20/weth"], -5.38),
    ]);

    expect(change.get("ethereum")).toBe(-5.42);
    expect(change.get("weth")).toBe(-5.38);
  });
});

describe("countervalueChangeFromDayPercent", () => {
  it("should turn percent points into a ratio and the fiat delta", () => {
    const change = countervalueChangeFromDayPercent(110, 10);

    expect(change?.percentage).toBe(0.1);
    expect(change?.value).toBeCloseTo(10);
  });

  it("should return nothing when the previous value would be zero", () => {
    expect(countervalueChangeFromDayPercent(50, -100)).toBeUndefined();
  });

  it("should return nothing without a current countervalue", () => {
    expect(countervalueChangeFromDayPercent(undefined, 1.4)).toBeUndefined();
  });
});

describe("useMarketDayChange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeldCurrencyIds.mockReturnValue([]);
    mockUseGetMarketsByLedgerIdsQuery.mockReturnValue({ currentData: undefined });
  });

  it("should ask /v3/markets once for every held currency, sorted and deduplicated", () => {
    mockHeldCurrencyIds.mockReturnValue(["ethereum", "bitcoin", "ethereum"]);
    mockUseGetMarketsByLedgerIdsQuery.mockReturnValue({
      currentData: [market("bitcoin", ["bitcoin"], 1.4), market("ethereum", ["ethereum"], -5.42)],
    });

    const { result } = renderHook(() => useMarketDayChange());

    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledTimes(1);
    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledWith(
      { ledgerIds: ["bitcoin", "ethereum"], counterCurrency: "USD" },
      {
        skip: false,
        pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
        skipPollingIfUnfocused: true,
      },
    );
    expect(result.current.byLedgerId.get("ethereum")).toBe(-5.42);
    expect(result.current.byMarketId.get("ethereum")).toBe(-5.42);
  });

  it("should not query without accounts", () => {
    const { result } = renderHook(() => useMarketDayChange());

    expect(mockUseGetMarketsByLedgerIdsQuery).toHaveBeenCalledWith(
      { ledgerIds: [], counterCurrency: "USD" },
      expect.objectContaining({ skip: true }),
    );
    expect(result.current.byLedgerId.size).toBe(0);
    expect(result.current.byMarketId.size).toBe(0);
  });
});
