import { renderHook, act } from "@tests/test-renderer";
import { useBalanceGraphViewModel } from "../useBalanceGraphViewModel";
import { track } from "~/analytics";
import {
  useGetCurrencyDataQuery,
  useGetAssetChartDataQuery,
} from "@ledgerhq/live-common/market/state-manager/marketApi";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import type { State } from "~/reducers/types";
import { marketCurrencyData } from "../../../__fixtures__/marketCurrencyData";
import type { RangeKey } from "../../../utils/rangeMapping";

jest.mock("@ledgerhq/live-common/market/state-manager/marketApi", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/marketApi"),
  useGetCurrencyDataQuery: jest.fn(),
  useGetAssetChartDataQuery: jest.fn(),
}));
jest.mock("LLM/features/Receive");

const mockUseGetCurrencyDataQuery = jest.mocked(useGetCurrencyDataQuery);
const mockUseGetAssetChartDataQuery = jest.mocked(useGetAssetChartDataQuery);
const mockUseOpenReceiveDrawer = jest.mocked(useOpenReceiveDrawer);
const handleOpenReceiveDrawer = jest.fn();

// --- Fixtures ---------------------------------------------------------------

const eursToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/stasis_eurs",
  contractAddress: "0xdB25f211AB05b1c97D595516F45794528a807ad8",
  parentCurrency: mockEthCryptoCurrency,
  tokenType: "erc20",
  name: "STASIS EURS Token",
  ticker: "EURS",
  units: [{ name: "STASIS EURS Token", code: "EURS", magnitude: 2 }],
};

const CHART_DATA_BY_RANGE: Record<RangeKey, Array<[number, number]>> = {
  "1d": [
    [Date.UTC(2024, 0, 2, 10, 0), 100],
    [Date.UTC(2024, 0, 2, 11, 0), 110],
    [Date.UTC(2024, 0, 2, 12, 0), 120],
  ],
  "1w": [
    [Date.UTC(2024, 0, 2, 10, 0), 200],
    [Date.UTC(2024, 0, 2, 11, 0), 210],
  ],
  "1m": [[Date.UTC(2024, 0, 2, 10, 0), 300]],
  "1y": [
    [Date.UTC(2024, 0, 2, 10, 0), 400],
    [Date.UTC(2024, 0, 2, 11, 0), 410],
    [Date.UTC(2024, 0, 2, 12, 0), 420],
    [Date.UTC(2024, 0, 2, 13, 0), 430],
  ],
  all: [
    [Date.UTC(2024, 0, 2, 10, 0), 100],
    [Date.UTC(2024, 0, 2, 11, 0), 220],
  ],
};

// --- Helpers ----------------------------------------------------------------

type VMParams = Parameters<typeof useBalanceGraphViewModel>[0];
type StateOption = { overrideInitialState: (state: State) => State };

const mockCurrency = (result: { data: unknown; isFetching?: boolean }) =>
  mockUseGetCurrencyDataQuery.mockReturnValue({
    isFetching: false,
    ...result,
  } as unknown as ReturnType<typeof useGetCurrencyDataQuery>);

const mockChart = (result: { data: unknown; isLoading?: boolean }) =>
  mockUseGetAssetChartDataQuery.mockReturnValue({
    isLoading: false,
    ...result,
  } as unknown as ReturnType<typeof useGetAssetChartDataQuery>);

const renderVM = (params: VMParams = { currency: mockBtcCryptoCurrency }, options?: StateOption) =>
  renderHook(() => useBalanceGraphViewModel(params), options);

type TokenFunds = { token: TokenCurrency; balance: number };
type AccountFunds = { currencyId: string; balance: number; tokens?: TokenFunds[] };

const CURRENCY_BY_ID: Record<string, CryptoCurrency> = {
  bitcoin: mockBtcCryptoCurrency,
  ethereum: mockEthCryptoCurrency,
};

function buildAccount({ currencyId, balance, tokens }: AccountFunds, index: number) {
  const account = genAccount(`${currencyId}-${index}`, {
    currency: CURRENCY_BY_ID[currencyId],
    operationsSize: 0,
  });
  account.balance = new BigNumber(balance);
  account.spendableBalance = new BigNumber(balance);

  if (tokens?.length) {
    account.subAccounts = tokens.map(({ token, balance: tokenBalance }) => {
      const tokenAccount = genTokenAccount(index, account, token);
      tokenAccount.balance = new BigNumber(tokenBalance);
      tokenAccount.spendableBalance = new BigNumber(tokenBalance);
      return tokenAccount;
    });
  }

  return account;
}

const withFunds = (accounts: AccountFunds[]): StateOption => ({
  overrideInitialState: (state: State): State => ({
    ...state,
    accounts: { ...state.accounts, active: accounts.map(buildAccount) },
  }),
});

// --- Tests ------------------------------------------------------------------

describe("useBalanceGraphViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrency({ data: marketCurrencyData });
    mockChart({ data: CHART_DATA_BY_RANGE });
    mockUseOpenReceiveDrawer.mockReturnValue({ handleOpenReceiveDrawer });
  });

  describe("price & trend", () => {
    it("exposes price and the 24h change percentage by default", () => {
      const { result } = renderVM();

      expect(result.current.price).toBe(50000);
      expect(result.current.priceChangePercentage).toBe(2.35);
    });

    it("returns price=0 and hasMarketData=false when no market data", () => {
      mockCurrency({ data: undefined });

      const { result } = renderVM();

      expect(result.current.price).toBe(0);
      expect(result.current.hasMarketData).toBe(false);
      expect(result.current.priceChangePercentage).toBeNaN();
    });

    it("uses the correct priceChangePercentage key after range change", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1w"));
      expect(result.current.priceChangePercentage).toBe(-5.12);

      act(() => result.current.onRangeChange("1y"));
      expect(result.current.priceChangePercentage).toBe(150.0);
    });
  });

  describe("priceFormatter", () => {
    it("splits a USD-formatted value into FormattedValue parts", () => {
      const { result } = renderVM();

      const formatted = result.current.priceFormatter(1234.56);

      expect(formatted.integerPart).toBe("1,234");
      expect(formatted.decimalPart).toBe("56");
      expect(formatted.decimalSeparator).toBe(".");
      expect(formatted.currencyText).toBe("$");
    });

    it("preserves 6 decimals for a sub-cent BONK-like price", () => {
      const { result } = renderVM();

      const formatted = result.current.priceFormatter(0.000006);

      expect(formatted.integerPart).toBe("0");
      expect(formatted.decimalPart).toBe("000006");
      expect(formatted.currencyText).toBe("$");
    });
  });

  describe("formattedPriceChange", () => {
    it("returns a signed currency string for a positive change", () => {
      const { result } = renderVM();

      expect(result.current.formattedPriceChange).toMatch(/^\+/);
    });

    it("returns a minus-prefixed string for a negative change", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1w"));

      expect(result.current.formattedPriceChange).toMatch(/^-/);
    });

    it("returns undefined when no market data", () => {
      mockCurrency({ data: undefined });

      const { result } = renderVM();

      expect(result.current.formattedPriceChange).toBeUndefined();
    });

    it("renders a signed '<' threshold marker for a tiny BONK-like variation", () => {
      mockCurrency({ data: { ...marketCurrencyData, price: 6e-6 } });

      const { result } = renderVM();

      expect(result.current.formattedPriceChange).toBe("+<$0.000001");
    });
  });

  describe("onRangeChange", () => {
    it("updates selectedRange and fires analytics", () => {
      const { result } = renderVM();

      expect(result.current.selectedRange).toBe("1d");

      act(() => result.current.onRangeChange("1m"));

      expect(result.current.selectedRange).toBe("1m");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "timeframe",
        timeframe: "1m",
        page: "Asset Detail",
        currency: "bitcoin",
      });
    });

    it("does not fire analytics when selecting the same range", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1d"));

      expect(track).not.toHaveBeenCalled();
    });
  });

  describe("showReceive", () => {
    it("is false when currency is undefined", () => {
      const { result } = renderVM({ currency: undefined });

      expect(result.current.showReceive).toBe(false);
    });

    it("is true when the asset has no funds but another asset does", () => {
      const { result } = renderVM(
        { currency: mockBtcCryptoCurrency },
        withFunds([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(true);
    });

    it("is false when the asset already has funds", () => {
      const { result } = renderVM(
        { currency: mockBtcCryptoCurrency },
        withFunds([
          { currencyId: "bitcoin", balance: 500 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when the wallet has no funds at all", () => {
      const { result } = renderVM(
        { currency: mockBtcCryptoCurrency },
        withFunds([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 0 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when hideReceive is true even if conditions are met", () => {
      const { result } = renderVM(
        { currency: mockBtcCryptoCurrency, hideReceive: true },
        withFunds([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false for a token the user already holds (regression: ERC-20 detected via flattenAccounts)", () => {
      const { result } = renderVM(
        { currency: eursToken },
        withFunds([
          {
            currencyId: "ethereum",
            balance: 0,
            tokens: [{ token: eursToken, balance: 36_300_500 }],
          },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });
  });

  describe("onReceivePress", () => {
    it("tracks analytics and opens the receive drawer", () => {
      const { result } = renderVM();

      act(() => result.current.onReceivePress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "receive",
        page: "Asset Detail",
        currency: "bitcoin",
      });
      expect(handleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
    });

    it("forwards the parent-provided ledgerIds list to useOpenReceiveDrawer", () => {
      const ledgerIds = ["ethereum", "optimism", "arbitrum", "base"];

      renderHook(() =>
        useBalanceGraphViewModel({
          currency: mockBtcCryptoCurrency,
          hideReceive: false,
          ledgerIds,
        }),
      );

      expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
        expect.objectContaining({ currency: mockBtcCryptoCurrency, currencyIds: ledgerIds }),
      );
    });

    it("falls back to the locally derived ledgerIds when no list is threaded down", () => {
      renderHook(() => useBalanceGraphViewModel({ currency: mockBtcCryptoCurrency }));

      expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: mockBtcCryptoCurrency,
          currencyIds: expect.any(Array),
        }),
      );
    });
  });

  describe("ranges", () => {
    it("exposes the full range list in chronological order (1d → all)", () => {
      const { result } = renderVM();

      const values = result.current.ranges.map(r => r.value);
      expect(values).toEqual(["1d", "1w", "1m", "1y", "all"]);
    });

    it("exposes a runtime guard that accepts only known range keys", () => {
      const { result } = renderVM();

      expect(result.current.isRangeValue("1d")).toBe(true);
      expect(result.current.isRangeValue("1y")).toBe(true);
      expect(result.current.isRangeValue("99y")).toBe(false);
    });
  });

  describe("series and chartColor", () => {
    it("builds the price series from the chart data of the selected range", () => {
      const { result } = renderVM();

      expect(result.current.series).toHaveLength(1);
      expect(result.current.series[0]?.id).toBe("asset-detail-price");
      expect(result.current.series[0]?.data).toEqual([100, 110, 120]);
    });

    it("rebuilds the series when the selected range changes", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1w"));
      expect(result.current.series[0]?.data).toEqual([200, 210]);

      act(() => result.current.onRangeChange("1y"));
      expect(result.current.series[0]?.data).toEqual([400, 410, 420, 430]);
    });

    it("keeps a stable series identity across renders when inputs are unchanged", () => {
      const { result, rerender } = renderVM();

      const initial = result.current.series;
      rerender({});
      expect(result.current.series).toBe(initial);
    });

    it("returns an empty series when no chart data is available", () => {
      mockChart({ data: undefined });

      const { result } = renderVM();

      expect(result.current.series).toHaveLength(1);
      expect(result.current.series[0]?.data).toEqual([]);
    });

    it("returns chartColor='success' when the selected range has a positive % change", () => {
      const { result } = renderVM();

      expect(result.current.chartColor).toBe("success");
    });

    it("returns chartColor='error' when the selected range has a negative % change", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1w"));
      expect(result.current.chartColor).toBe("error");
    });

    it("returns chartColor='muted' when no market data is available", () => {
      mockCurrency({ data: undefined });

      const { result } = renderVM();

      expect(result.current.chartColor).toBe("muted");
    });
  });

  describe("chart formatting & axes", () => {
    it("formats a chart value as a counter-value price string", () => {
      const { result } = renderVM();

      expect(result.current.formatValue(100)).toContain("100");
    });

    it("builds a tooltip title from the timestamp at the given index", () => {
      const { result } = renderVM();

      // 1d chart data timestamps are [1, 2, 3].
      const title = result.current.tooltipTitle(0);
      expect(typeof title).toBe("string");
      expect(title).not.toBe("");
    });

    it("returns undefined tooltip title for an out-of-range index", () => {
      const { result } = renderVM();

      expect(result.current.tooltipTitle(99)).toBeUndefined();
    });

    it("hides the x-axis and keeps the y-axis hidden", () => {
      const { result } = renderVM();

      expect(result.current.showXAxis).toBe(false);
      expect(result.current.showYAxis).toBe(false);
    });

    it("exposes evenly spaced x-axis ticks covering every point when data is short", () => {
      const { result } = renderVM();

      // 1d has 3 points (<= min ticks) → one tick per point.
      expect(result.current.xAxis.ticks).toEqual([0, 1, 2]);
    });

    it("pads the y-axis domain asymmetrically (more headroom at the bottom)", () => {
      const { result } = renderVM();

      const domain = result.current.yAxis.domain;
      expect(typeof domain).toBe("function");
      // @ts-expect-error domain is the function form here.
      const padded = domain({ min: 0, max: 100 });
      expect(padded.min).toBeLessThan(0);
      expect(padded.max).toBeGreaterThan(100);
      expect(Math.abs(padded.min)).toBeGreaterThan(padded.max - 100);
    });
  });

  describe("scrubbing", () => {
    it("drives the price, date and range-start variation from the hovered point", () => {
      const { result } = renderVM();

      // 1d series data is [100, 110, 120] with timestamps [1, 2, 3].
      act(() => result.current.onScrubberPositionChange(1));

      expect(result.current.isScrubbing).toBe(true);
      expect(result.current.price).toBe(110);
      // Variation from the range start (100) to the hovered point (110) = +10%.
      expect(result.current.priceChangePercentage).toBeCloseTo(10);
      expect(result.current.formattedPriceChange).toMatch(/^\+/);
      expect(typeof result.current.timeLabel).toBe("string");
      expect(result.current.timeLabel).not.toBe("");
    });

    it("reverts to the live price and range label when scrubbing ends", () => {
      const { result } = renderVM();

      const rangeLabel = result.current.timeLabel;

      act(() => result.current.onScrubberPositionChange(2));
      expect(result.current.price).toBe(120);

      act(() => result.current.onScrubberPositionChange(undefined));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
      expect(result.current.timeLabel).toBe(rangeLabel);
    });

    it("ignores an out-of-range index (no scrub)", () => {
      const { result } = renderVM();

      act(() => result.current.onScrubberPositionChange(99));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
    });

    it("ignores a non-finite value at the hovered index", () => {
      mockChart({ data: { ...CHART_DATA_BY_RANGE, "1d": [[1, NaN]] } });

      const { result } = renderVM();

      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
    });

    it("shows a 0 price / 0 timestamp point instead of swallowing it", () => {
      mockChart({ data: { ...CHART_DATA_BY_RANGE, "1d": [[0, 0]] } });

      const { result } = renderVM();

      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.isScrubbing).toBe(true);
      expect(result.current.price).toBe(0);
      expect(result.current.timeLabel).toBeDefined();
    });

    it("clears the selection when the range changes mid-scrub", () => {
      const { result } = renderVM();

      act(() => result.current.onScrubberPositionChange(1));
      expect(result.current.isScrubbing).toBe(true);

      act(() => result.current.onRangeChange("1w"));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
    });

    it("formats 1w hover time label as time + date", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1w"));
      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.timeLabel).toContain("2024");
      expect(result.current.timeLabel).toContain(":");
    });

    it("formats 1d hover time label as time only", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1d"));
      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.timeLabel).toContain(":");
      expect(result.current.timeLabel).not.toContain("2024");
    });

    it("formats 1y hover time label as date only", () => {
      const { result } = renderVM();

      act(() => result.current.onRangeChange("1y"));
      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.timeLabel).toContain("2024");
      expect(result.current.timeLabel).not.toContain(":");
    });
  });

  describe("transaction points", () => {
    it("always enables point-only tooltips", () => {
      const { result } = renderVM();

      expect(result.current.pointTooltipsOnly).toBe(true);
    });

    it("exposes the extrema markers when there are no scoped operations", () => {
      const { result } = renderVM();

      // 1d series data is [100, 110, 120] → min at index 0, max at index 2.
      expect(result.current.points).toEqual([
        { index: 2, value: 120, color: "success", labelPosition: "top", hidePoint: true },
        { index: 0, value: 100, color: "error", labelPosition: "bottom", hidePoint: true },
      ]);
    });
  });

  describe("isLoading", () => {
    it("reflects the fetching state of useCurrencyData", () => {
      mockCurrency({ data: undefined, isFetching: true });

      const { result } = renderVM({
        currency: mockBtcCryptoCurrency,
        marketApiId: mockBtcCryptoCurrency.id,
        knownLedgerIds: [mockBtcCryptoCurrency.id],
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("is true while the chart data query is loading", () => {
      mockChart({ data: undefined, isLoading: true });

      const { result } = renderVM();

      expect(result.current.isLoading).toBe(true);
    });
  });
});
