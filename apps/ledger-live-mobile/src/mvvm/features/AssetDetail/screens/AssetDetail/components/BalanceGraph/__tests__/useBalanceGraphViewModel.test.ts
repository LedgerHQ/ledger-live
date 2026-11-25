import { track } from "@shared/analytics";
import { renderHook, act, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import type { PathParams } from "msw";
import { useBalanceGraphViewModel } from "../useBalanceGraphViewModel";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/marketApi";
import { marketChartApi } from "@domain/api-market-chart";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import BigNumber from "bignumber.js";
import type { State } from "~/reducers/types";
import { marketCurrencyData } from "../../../__fixtures__/marketCurrencyData";
import type { RangeKey } from "../../../utils/rangeMapping";
import { ASSET_DETAIL_CHART_HEIGHT } from "../constants";

jest.mock("@ledgerhq/live-common/market/state-manager/marketApi", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/marketApi"),
  useGetCurrencyDataQuery: jest.fn(),
}));
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useUsdToFiatRate: jest.fn(() => ({ status: "ready", rate: 1 })),
}));
jest.mock("LLM/features/Receive");

const mockUseGetCurrencyDataQuery = jest.mocked(useGetCurrencyDataQuery);
const endpoints = {
  chart: jest.fn<Response | Promise<Response>, [{ request: Request; params: PathParams }]>(),
  supported: jest.fn<Response, [{ request: Request }]>(),
};
const releaseHeldCharts: Array<() => void> = [];
const mockUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);
const mockUseOpenReceiveDrawer = jest.mocked(useOpenReceiveDrawer);
const handleOpenReceiveDrawer = jest.fn();

// --- Fixtures ---------------------------------------------------------------

const eursToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/stasis_eurs"),
  contractAddress: "0xdB25f211AB05b1c97D595516F45794528a807ad8",
  parentCurrencyId: mockEthCryptoCurrency.id,
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
  // Days apart so the 1y resampler (3-day target) keeps every point.
  "1y": [
    [Date.UTC(2024, 0, 2, 10, 0), 400],
    [Date.UTC(2024, 0, 6, 10, 0), 410],
    [Date.UTC(2024, 0, 10, 10, 0), 420],
    [Date.UTC(2024, 0, 14, 10, 0), 430],
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

type ChartByRange = Record<string, Array<[number, number]> | undefined>;

const mockChart = (data: ChartByRange) =>
  endpoints.chart
    .mockReset()
    .mockImplementation(({ params }) =>
      HttpResponse.json({ values: data[String(params.segment)] ?? [] }),
    );

const mockChartFailure = () =>
  endpoints.chart.mockReset().mockImplementation(() => HttpResponse.json({}, { status: 500 }));

/** Answers the next chart requests only once the test ends, to observe the loading state. */
const holdChart = () => {
  const gate = new Promise<void>(resolve => releaseHeldCharts.push(resolve));
  endpoints.chart.mockReset().mockImplementation(async () => {
    await gate;
    return HttpResponse.json({ values: [] });
  });
};

const renderPendingVM = (
  params: VMParams = { currency: mockBtcCryptoCurrency },
  options?: StateOption,
) => renderHook(() => useBalanceGraphViewModel(params), options);

const renderVM = async (
  params: VMParams = { currency: mockBtcCryptoCurrency },
  options?: StateOption,
) => {
  const view = renderPendingVM(params, options);
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
};

type VMResult = { current: ReturnType<typeof useBalanceGraphViewModel> };

const changeRange = async (result: VMResult, range: RangeKey) => {
  act(() => result.current.onRangeChange(range));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
};

type TokenFunds = { token: TokenCurrency; balance: number };
type AccountFunds = { currencyId: string; balance: number; tokens?: TokenFunds[] };

const CURRENCY_BY_ID: Record<string, CryptoCurrency> = {
  bitcoin: mockBtcCryptoCurrency,
  ethereum: mockEthCryptoCurrency,
  optimism: getCryptoCurrencyById("optimism"),
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
    mockChart(CHART_DATA_BY_RANGE);
    endpoints.supported
      .mockReset()
      .mockImplementation(() => HttpResponse.json(["usd", "eur", "bitcoin"]));
    server.use(
      http.get("*/v3/markets/chart/:segment/:id", endpoints.chart),
      http.get("*/v3/supported/markets/chart/to", endpoints.supported),
    );
    mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 });
    mockUseOpenReceiveDrawer.mockReturnValue({
      handleOpenReceiveDrawer,
      openReceiveForAccount: jest.fn(),
    });
  });

  afterEach(() => {
    releaseHeldCharts.splice(0).forEach(release => release());
  });

  describe("price & trend", () => {
    it("exposes price and the 24h change percentage by default", async () => {
      const { result } = await renderVM();

      expect(result.current.price).toBe(50000);
      expect(result.current.priceChangePercentage).toBe(2.35);
    });

    it("returns price=0 and hasMarketData=false when no market data", async () => {
      mockCurrency({ data: undefined });

      const { result } = await renderVM();

      expect(result.current.price).toBe(0);
      expect(result.current.hasMarketData).toBe(false);
      expect(result.current.priceChangePercentage).toBeNaN();
    });

    it("uses the correct priceChangePercentage key after range change", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1w");
      expect(result.current.priceChangePercentage).toBe(-5.12);

      await changeRange(result, "1y");
      expect(result.current.priceChangePercentage).toBe(150.0);
    });
  });

  describe("priceFormatter", () => {
    it("splits a USD-formatted value into FormattedValue parts", async () => {
      const { result } = await renderVM();

      const formatted = result.current.priceFormatter(1234.56);

      expect(formatted.integerPart).toBe("1,234");
      expect(formatted.decimalPart).toBe("56");
      expect(formatted.decimalSeparator).toBe(".");
      expect(formatted.currencyText).toBe("$");
    });

    it("preserves 6 decimals for a sub-cent BONK-like price", async () => {
      const { result } = await renderVM();

      const formatted = result.current.priceFormatter(0.000006);

      expect(formatted.integerPart).toBe("0");
      expect(formatted.decimalPart).toBe("000006");
      expect(formatted.currencyText).toBe("$");
    });
  });

  describe("formattedPriceChange", () => {
    it("returns a signed currency string for a positive change", async () => {
      const { result } = await renderVM();

      expect(result.current.formattedPriceChange).toMatch(/^\+/);
    });

    it("returns a minus-prefixed string for a negative change", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1w");

      expect(result.current.formattedPriceChange).toMatch(/^-/);
    });

    it("returns undefined when no market data", async () => {
      mockCurrency({ data: undefined });

      const { result } = await renderVM();

      expect(result.current.formattedPriceChange).toBeUndefined();
    });

    it("renders a signed '<' threshold marker for a tiny BONK-like variation", async () => {
      mockCurrency({ data: { ...marketCurrencyData, price: 6e-6 } });

      const { result } = await renderVM();

      expect(result.current.formattedPriceChange).toBe("+<$0.000001");
    });
  });

  describe("onRangeChange", () => {
    it("updates selectedRange and fires analytics", async () => {
      const { result } = await renderVM();

      expect(result.current.selectedRange).toBe("1d");

      await changeRange(result, "1m");

      expect(result.current.selectedRange).toBe("1m");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "timeframe",
        timeframe: "1m",
        page: "Asset Detail",
        currency: "bitcoin",
      });
    });

    it("does not fire analytics when selecting the same range", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1d");

      expect(track).not.toHaveBeenCalled();
    });
  });

  describe("showReceive", () => {
    it("is false when currency is undefined", async () => {
      const { result } = await renderVM({ currency: undefined });

      expect(result.current.showReceive).toBe(false);
    });

    it("is true when the asset has no account", async () => {
      const { result } = await renderVM(
        { currency: mockBtcCryptoCurrency },
        withFunds([{ currencyId: "ethereum", balance: 1000 }]),
      );

      expect(result.current.showReceive).toBe(true);
    });

    it("is false when the asset already has an account without funds", async () => {
      const { result } = await renderVM(
        { currency: mockBtcCryptoCurrency },
        withFunds([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when the asset already has funds", async () => {
      const { result } = await renderVM(
        { currency: mockBtcCryptoCurrency },
        withFunds([
          { currencyId: "bitcoin", balance: 500 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when a multi-network asset has funds on another ledger id", async () => {
      const { result } = await renderVM(
        { currency: mockEthCryptoCurrency, ledgerIds: ["ethereum", "optimism"] },
        withFunds([
          { currencyId: "ethereum", balance: 0 },
          { currencyId: "optimism", balance: 500 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when the wallet has an asset account with no funds at all", async () => {
      const { result } = await renderVM(
        { currency: mockBtcCryptoCurrency },
        withFunds([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 0 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false when hideReceive is true even if conditions are met", async () => {
      const { result } = await renderVM(
        { currency: mockBtcCryptoCurrency, hideReceive: true },
        withFunds([
          { currencyId: "bitcoin", balance: 0 },
          { currencyId: "ethereum", balance: 1000 },
        ]),
      );

      expect(result.current.showReceive).toBe(false);
    });

    it("is false for a token the user already holds (regression: ERC-20 detected via flattenAccounts)", async () => {
      const { result } = await renderVM(
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
    it("tracks analytics and opens the receive drawer", async () => {
      const { result } = await renderVM();

      act(() => result.current.onReceivePress());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "receive",
        page: "Asset Detail",
        currency: "bitcoin",
      });
      expect(handleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
    });

    it("forwards the parent-provided ledgerIds list to useOpenReceiveDrawer", async () => {
      const ledgerIds = ["ethereum", "optimism", "arbitrum", "base"];

      await renderVM({ currency: mockBtcCryptoCurrency, hideReceive: false, ledgerIds });

      expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
        expect.objectContaining({ currency: mockBtcCryptoCurrency, currencyIds: ledgerIds }),
      );
    });

    it("falls back to the locally derived ledgerIds when no list is threaded down", async () => {
      await renderVM({ currency: mockBtcCryptoCurrency });

      expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: mockBtcCryptoCurrency,
          currencyIds: expect.any(Array),
        }),
      );
    });
  });

  describe("ranges", () => {
    it("exposes the full range list in chronological order (1d → all)", async () => {
      const { result } = await renderVM();

      const values = result.current.ranges.map(r => r.value);
      expect(values).toEqual(["1d", "1w", "1m", "1y", "all"]);
    });

    it("exposes a runtime guard that accepts only known range keys", async () => {
      const { result } = await renderVM();

      expect(result.current.isRangeValue("1d")).toBe(true);
      expect(result.current.isRangeValue("1y")).toBe(true);
      expect(result.current.isRangeValue("99y")).toBe(false);
    });
  });

  describe("series and chartColor", () => {
    it("builds the price series from the chart data of the selected range", async () => {
      const { result } = await renderVM();

      expect(result.current.series).toHaveLength(1);
      expect(result.current.series[0]?.id).toBe("asset-detail-price");
      expect(result.current.series[0]?.data).toEqual([100, 110, 120, 50000]);
    });

    it("should end the series on the header price", async () => {
      const { result } = await renderVM();

      expect(result.current.series[0]?.data.at(-1)).toBe(50000);
      expect(result.current.price).toBe(50000);
    });

    it("rebuilds the series when the selected range changes", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1w");
      expect(result.current.series[0]?.data).toEqual([200, 210, 50000]);

      await changeRange(result, "1y");
      expect(result.current.series[0]?.data).toEqual([400, 410, 420, 430, 50000]);
    });

    it("keeps a stable series identity across renders when inputs are unchanged", async () => {
      const { result, rerender } = await renderVM();

      const initial = result.current.series;
      rerender({});
      expect(result.current.series).toBe(initial);
    });

    it("returns an empty series when the chart request fails", async () => {
      mockChartFailure();

      const { result } = await renderVM();

      expect(result.current.series).toHaveLength(1);
      expect(result.current.series[0]?.data).toEqual([]);
    });

    it("returns chartColor='success' when the selected range has a positive % change", async () => {
      const { result } = await renderVM();

      expect(result.current.chartColor).toBe("success");
    });

    it("returns chartColor='error' when the selected range has a negative % change", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1w");
      expect(result.current.chartColor).toBe("error");
    });

    it("returns chartColor='muted' when no market data is available", async () => {
      mockCurrency({ data: undefined });

      const { result } = await renderVM();

      expect(result.current.chartColor).toBe("muted");
    });
  });

  describe("crypto countervalue (BTC)", () => {
    const withBtcCounterValue: StateOption = {
      overrideInitialState: (state: State): State => ({
        ...state,
        settings: { ...state.settings, counterValue: "bitcoin" },
      }),
    };

    it("fetches the chart in USD when the ticker is outside the chart allowlist", async () => {
      await renderVM({ currency: mockBtcCryptoCurrency }, withBtcCounterValue);

      const requestedUrl = new URL(endpoints.chart.mock.calls[0][0].request.url);
      expect(requestedUrl.searchParams.get("to")).toBe("usd");
      expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("btc", expect.anything());
    });

    it("rescales the USD chart into the BTC counter value", async () => {
      mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 2 });

      const { result } = await renderVM({ currency: mockBtcCryptoCurrency }, withBtcCounterValue);

      expect(result.current.series[0]?.data).toEqual([200, 220, 240, 50000]);
    });
  });

  describe("chart formatting & axes", () => {
    it("formats a chart value as a counter-value price string", async () => {
      const { result } = await renderVM();

      expect(result.current.formatValue(100)).toContain("100");
    });

    it("builds a tooltip title from the timestamp at the given index", async () => {
      const { result } = await renderVM();

      // 1d chart data timestamps are [1, 2, 3].
      const title = result.current.tooltipTitle(0);
      expect(typeof title).toBe("string");
      expect(title).not.toBe("");
    });

    it("returns undefined tooltip title for an out-of-range index", async () => {
      const { result } = await renderVM();

      expect(result.current.tooltipTitle(99)).toBeUndefined();
    });

    it("hides the x-axis and keeps the y-axis hidden", async () => {
      const { result } = await renderVM();

      expect(result.current.showXAxis).toBe(false);
      expect(result.current.showYAxis).toBe(false);
    });

    it("exposes evenly spaced x-axis ticks covering every point when data is short", async () => {
      const { result } = await renderVM();

      // 1d has 4 points (<= min ticks) → one tick per point.
      expect(result.current.xAxis.ticks).toEqual([0, 1, 2, 3]);
    });

    it("pads the y-axis domain 32px below the min and 24px above the max for their labels", async () => {
      const { result } = await renderVM();

      const domain = result.current.yAxis.domain;
      expect(typeof domain).toBe("function");
      // @ts-expect-error domain is the function form here.
      const padded = domain({ min: 0, max: 100 });
      const valuePerPx = (padded.max - padded.min) / ASSET_DETAIL_CHART_HEIGHT;

      expect((0 - padded.min) / valuePerPx).toBeCloseTo(32);
      expect((padded.max - 100) / valuePerPx).toBeCloseTo(24);
    });
  });

  describe("scrubbing", () => {
    it("drives the price, date and range-start variation from the hovered point", async () => {
      const { result } = await renderVM();

      // Historical 1d points stay [100, 110, 120]; the live price is appended after them.
      act(() => result.current.onScrubberPositionChange(1));

      expect(result.current.isScrubbing).toBe(true);
      expect(result.current.price).toBe(110);
      // Variation from the range start (100) to the hovered point (110) = +10%.
      expect(result.current.priceChangePercentage).toBeCloseTo(10);
      expect(result.current.formattedPriceChange).toMatch(/^\+/);
      expect(typeof result.current.timeLabel).toBe("string");
      expect(result.current.timeLabel).not.toBe("");
    });

    it("reverts to the live price and range label when scrubbing ends", async () => {
      const { result } = await renderVM();

      const rangeLabel = result.current.timeLabel;

      act(() => result.current.onScrubberPositionChange(2));
      expect(result.current.price).toBe(120);

      act(() => result.current.onScrubberPositionChange(undefined));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
      expect(result.current.timeLabel).toBe(rangeLabel);
    });

    it("should show the header price when scrubbing the last point and keep it after release", async () => {
      const { result } = await renderVM();

      const lastIndex = result.current.series[0].data.length - 1;
      act(() => result.current.onScrubberPositionChange(lastIndex));

      expect(result.current.price).toBe(50000);

      act(() => result.current.onScrubberPositionChange(undefined));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
    });

    it("ignores an out-of-range index (no scrub)", async () => {
      const { result } = await renderVM();

      act(() => result.current.onScrubberPositionChange(99));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
    });

    it("ignores a chart point the API schema rejects", async () => {
      endpoints.chart
        .mockReset()
        .mockImplementation(() => HttpResponse.json({ values: [[1, null]] }));

      const { result } = await renderVM();

      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
    });

    it("shows a 0 price / 0 timestamp point instead of swallowing it", async () => {
      mockChart({ ...CHART_DATA_BY_RANGE, "1d": [[0, 0]] });

      const { result } = await renderVM();

      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.isScrubbing).toBe(true);
      expect(result.current.price).toBe(0);
      expect(result.current.timeLabel).toBeDefined();
    });

    it("clears the selection when the range changes mid-scrub", async () => {
      const { result } = await renderVM();

      act(() => result.current.onScrubberPositionChange(1));
      expect(result.current.isScrubbing).toBe(true);

      await changeRange(result, "1w");

      expect(result.current.isScrubbing).toBe(false);
      expect(result.current.price).toBe(50000);
    });

    it("formats 1w hover time label as time + date", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1w");
      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.timeLabel).toContain("2024");
      expect(result.current.timeLabel).toContain(":");
    });

    it("formats 1d hover time label as time only", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1d");
      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.timeLabel).toContain(":");
      expect(result.current.timeLabel).not.toContain("2024");
    });

    it("formats 1y hover time label as date only", async () => {
      const { result } = await renderVM();

      await changeRange(result, "1y");
      act(() => result.current.onScrubberPositionChange(0));

      expect(result.current.timeLabel).toContain("2024");
      expect(result.current.timeLabel).not.toContain(":");
    });
  });

  describe("transaction points", () => {
    it("always enables point-only tooltips", async () => {
      const { result } = await renderVM();

      expect(result.current.pointTooltipsOnly).toBe(true);
    });

    it("exposes the extrema markers when there are no scoped operations", async () => {
      const { result } = await renderVM();

      expect(result.current.points).toEqual([
        { index: 3, value: 50000, color: "success", labelPosition: "top", hidePoint: true },
        { index: 0, value: 100, color: "error", labelPosition: "bottom", hidePoint: true },
      ]);
    });
  });

  describe("isLoading", () => {
    it("reflects the fetching state of useCurrencyData", () => {
      mockCurrency({ data: undefined, isFetching: true });

      const { result } = renderPendingVM({
        currency: mockBtcCryptoCurrency,
        marketApiId: mockBtcCryptoCurrency.id,
        knownLedgerIds: [mockBtcCryptoCurrency.id],
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("is true until the chart request resolves", async () => {
      holdChart();

      const { result } = renderPendingVM();
      await waitFor(() => expect(endpoints.chart).toHaveBeenCalledTimes(1));

      expect(result.current.isLoading).toBe(true);
    });

    it("is false once the chart request fails", async () => {
      mockChartFailure();

      const { result } = await renderVM();

      expect(result.current.isLoading).toBe(false);
    });

    it("stays false while refetching in the background with existing data", async () => {
      const { result, store } = await renderVM();
      holdChart();

      act(() => {
        store.dispatch(marketChartApi.util.invalidateTags(["ChartData"]));
      });
      await waitFor(() => expect(endpoints.chart).toHaveBeenCalledTimes(1));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.series[0].data.length).toBeGreaterThan(0);
    });
  });

  describe("timeframe transition", () => {
    it("keeps the previous timeframe series while the next one is loading", async () => {
      const { result } = await renderVM();
      const seriesBeforeChange = result.current.series;
      expect(seriesBeforeChange[0].data.length).toBeGreaterThan(0);
      holdChart();

      act(() => result.current.onRangeChange("1w"));
      await waitFor(() => expect(endpoints.chart).toHaveBeenCalledTimes(1));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.series).toBe(seriesBeforeChange);
    });

    it("drops the previous series once the new timeframe settles with no data", async () => {
      const { result } = await renderVM();
      expect(result.current.series[0].data.length).toBeGreaterThan(0);
      mockChart({ "1d": CHART_DATA_BY_RANGE["1d"], "1w": [] });

      await changeRange(result, "1w");

      expect(result.current.series[0].data).toHaveLength(0);
    });

    it("does not show the previous asset's series when switching to an asset with no data", async () => {
      const params: VMParams = { currency: mockBtcCryptoCurrency, knownLedgerIds: ["btc"] };
      const { result, rerender } = await renderVM(params);
      expect(result.current.series[0].data.length).toBeGreaterThan(0);

      // Switch to a different asset whose chart has no data yet (still fetching).
      holdChart();
      params.knownLedgerIds = ["other-asset"];
      rerender(undefined);
      await waitFor(() => expect(endpoints.chart).toHaveBeenCalledTimes(1));

      expect(result.current.series[0].data).toHaveLength(0);
      expect(result.current.isLoading).toBe(true);
    });
  });
});
