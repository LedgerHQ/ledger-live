import { act, renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import {
  KeysPriceChange,
  type MarketCurrencyData,
  Order,
} from "@ledgerhq/live-common/market/utils/types";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { createMockMarketListResult } from "@ledgerhq/live-common/market/utils/fixtures";
import { useSupportedCounterCurrencies } from "@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import { useMarket } from "../useMarket";
import { addStarredMarketCoins } from "~/renderer/actions/settings";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "@shared/analytics";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider");
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useUsdToFiatRate: jest.fn(),
}));

const mockedUseMarketData = jest.mocked(useMarketData);
const mockedUseSupportedCounterCurrencies = jest.mocked(useSupportedCounterCurrencies);
const mockedUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);
const mockFetchNextPage = jest.fn();
const mockResetToFirstPage = jest.fn();

const PRICE_CHANGE_ZERO: Record<KeysPriceChange, number> = {
  [KeysPriceChange.hour]: 0,
  [KeysPriceChange.day]: 0,
  [KeysPriceChange.week]: 0,
  [KeysPriceChange.month]: 0,
  [KeysPriceChange.sixMonths]: 0,
  [KeysPriceChange.year]: 0,
};

const createMarketCurrencyData = (
  overrides: Partial<MarketCurrencyData> = {},
): MarketCurrencyData => ({
  id: "bitcoin",
  ledgerIds: ["bitcoin"],
  name: "Bitcoin",
  image: "https://example.com/btc.png",
  marketcap: 1_700_000_000_000,
  marketcapRank: 1,
  totalVolume: 0,
  high24h: 0,
  low24h: 0,
  ticker: "btc",
  price: 92_258.93,
  priceChangePercentage: PRICE_CHANGE_ZERO,
  marketCapChangePercentage24h: 0,
  circulatingSupply: 0,
  ath: 0,
  athDate: new Date(0),
  atl: 0,
  atlDate: new Date(0),
  chartData: {},
  ...overrides,
});

const mockMarketData = (data: MarketCurrencyData[] = []) =>
  mockedUseMarketData.mockReturnValue(
    createMockMarketListResult({
      data,
      fetchNextPage: mockFetchNextPage,
      resetToFirstPage: mockResetToFirstPage,
    }),
  );

const mockSupportedCounterCurrencies = (supportedCounterCurrencies?: string[]) =>
  mockedUseSupportedCounterCurrencies.mockReturnValue({
    data: supportedCounterCurrencies,
  } as unknown as ReturnType<typeof useSupportedCounterCurrencies>);

const createMarketState = () => ({
  marketParams: {
    range: "24h",
    limit: 50,
    order: Order.MarketCapDesc,
    search: "",
  },
  currentPage: 1,
});

const createSettingsState = (starredMarketCoins: string[]) => ({
  ...SETTINGS_INITIAL_STATE,
  starredMarketCoins,
});

describe("useMarket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketData();
    // Defaults: supported list not yet loaded + a no-op rate, i.e. no USD fallback.
    mockSupportedCounterCurrencies(undefined);
    mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 });
  });

  describe("starred filter", () => {
    it("uses starredMarketCoins when the starred category is selected", () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin", "ethereum"]),
        market: { ...createMarketState(), category: "starred" as const },
      };

      renderHook(() => useMarket(), {
        initialState,
      });

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ starred: ["bitcoin", "ethereum"] }),
        expect.anything(),
      );
    });

    it("does not filter by favorites outside the starred category", () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin"]),
        market: createMarketState(),
      };

      renderHook(() => useMarket(), {
        initialState,
      });

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ starred: [] }),
        expect.anything(),
      );
    });

    it("updates starredMarketCoins when a coin is added", async () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin"]),
        market: createMarketState(),
      };

      const { result, store } = renderHook(() => useMarket(), {
        initialState,
      });

      expect(result.current.starredMarketCoins).toEqual(["bitcoin"]);

      await act(async () => {
        store.dispatch(addStarredMarketCoins("ethereum"));
      });

      await waitFor(() => {
        expect(result.current.starredMarketCoins).toContain("ethereum");
      });

      expect(result.current.starredMarketCoins).toEqual(["bitcoin", "ethereum"]);
    });

    it("toggleStar adds and removes coins from starredMarketCoins", async () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin"]),
        market: createMarketState(),
      };

      const { result } = renderHook(() => useMarket(), {
        initialState,
      });

      await act(async () => {
        result.current.toggleStar("ethereum", false);
      });

      await waitFor(() => {
        expect(result.current.starredMarketCoins).toContain("ethereum");
      });

      await act(async () => {
        result.current.toggleStar("ethereum", true);
      });

      await waitFor(() => {
        expect(result.current.starredMarketCoins).not.toContain("ethereum");
      });
    });

    it("toggleStar tracks favourite button clicks", async () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
          settings: createSettingsState([]),
          market: createMarketState(),
        },
      });

      await act(async () => {
        result.current.toggleStar("ethereum", false);
      });

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "favourite",
        currency: "ethereum",
        page: "",
        is_favourite: true,
      });

      await act(async () => {
        result.current.toggleStar("ethereum", true);
      });

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "favourite",
        currency: "ethereum",
        page: "",
        is_favourite: false,
      });
    });
  });

  describe("category", () => {
    const marketFlags = withFlagOverrides({
      lldRefreshMarketData: { enabled: false },
    });

    const marketStateWithCategory = (category: "all" | "starred" | "stocks") => ({
      ...createMarketState(),
      category,
    });

    it("shows the favorites empty state when the starred category has no coins", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...marketFlags,
          settings: createSettingsState([]),
          market: marketStateWithCategory("starred"),
        },
      });

      expect(result.current.emptyState).toBe("favorites");
      expect(result.current.marketData).toEqual([]);
    });

    it("enables the starred filter without an empty state when favorites exist", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...marketFlags,
          settings: createSettingsState(["bitcoin"]),
          market: marketStateWithCategory("starred"),
        },
      });

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ starred: ["bitcoin"] }),
        expect.anything(),
      );
      expect(result.current.emptyState).toBeUndefined();
    });

    it("does not flag an empty state for the stocks category", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...marketFlags,
          settings: createSettingsState([]),
          market: marketStateWithCategory("stocks"),
        },
      });

      expect(result.current.emptyState).toBeUndefined();
      expect(result.current.marketData).toEqual([]);
    });
  });

  describe("pagination", () => {
    const scrolledState = () => ({
      ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
      settings: createSettingsState([]),
      market: { ...createMarketState(), currentPage: 3 },
    });

    it("resets currentPage when sort order changes", async () => {
      const { result } = renderHook(() => useMarket(), { initialState: scrolledState() });

      await act(async () => {
        result.current.refresh({ order: Order.MarketCapAsc });
      });

      expect(result.current.marketCurrentPage).toBe(1);
    });

    it("truncates the list to its first page on resetMarketPage", () => {
      const { result } = renderHook(() => useMarket(), { initialState: scrolledState() });

      act(() => result.current.resetMarketPage());

      expect(mockResetToFirstPage).toHaveBeenCalledTimes(1);
      expect(result.current.marketCurrentPage).toBe(1);
    });

    it("loads the next page", () => {
      const { result } = renderHook(() => useMarket(), { initialState: scrolledState() });

      act(() => result.current.onLoadNextPage());

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("polls the list at the refresh rate", () => {
      const { result } = renderHook(() => useMarket(), { initialState: scrolledState() });

      expect(mockedUseMarketData).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ refreshRate: result.current.refreshRate }),
      );
    });
  });

  describe("time range options", () => {
    it("exposes full-label range options ordered shortest to longest", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
          settings: createSettingsState([]),
          market: createMarketState(),
        },
      });

      expect(result.current.timeRangeSelectOptions.map(option => option.value)).toEqual([
        "24h",
        "7d",
        "30d",
        "1y",
      ]);
      result.current.timeRangeSelectOptions.forEach(option => {
        expect(typeof option.label).toBe("string");
        expect(option.label.length).toBeGreaterThan(0);
      });
    });
  });

  // CoinGecko's markets endpoint cannot serve fiats outside its supported list
  // (e.g. COP), so the list falls back to a USD request and rescales every row by
  // the USD->COP spot rate, while still formatting with the COP unit.
  describe("unsupported fiat counter value (COP)", () => {
    const SUPPORTED_WITHOUT_COP = ["usd", "eur", "vnd"];

    const renderWithCounterValue = (counterValue: string) =>
      renderHook(() => useMarket(), {
        initialState: {
          ...withFlagOverrides({
            lldRefreshMarketData: { enabled: false },
          }),
          settings: { ...SETTINGS_INITIAL_STATE, counterValue, starredMarketCoins: [] },
          market: createMarketState(),
        },
      });
    const renderWithCop = () => renderWithCounterValue("COP");

    it("disables the market request while counter value support is unresolved", () => {
      mockSupportedCounterCurrencies(undefined);

      const { result } = renderWithCop();

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ counterCurrency: "cop" }),
        expect.objectContaining({ enabled: false }),
      );
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: true });
      expect(result.current.marketData).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it("requests in USD and rescales each row by the USD->COP rate", () => {
      mockSupportedCounterCurrencies(SUPPORTED_WITHOUT_COP);
      mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 4000 });
      mockMarketData([createMarketCurrencyData({ id: "bitcoin", price: 100, marketcap: 200 })]);

      const { result } = renderWithCop();

      // The request is made in USD (the markets endpoint cannot serve COP)...
      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ counterCurrency: "usd" }),
        expect.objectContaining({ enabled: true }),
      );
      // ...and the rate is fetched for the user's actual counter value.
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("cop", { skip: false });
      // Values are rescaled back into COP, and rows are formatted with the COP unit.
      expect(result.current.marketData[0].price).toBe(400_000);
      expect(result.current.marketData[0].marketcap).toBe(800_000);
      expect(result.current.marketParams.counterCurrency).toBe("cop");
    });

    it("withholds rows and stays loading until the rate resolves", () => {
      mockSupportedCounterCurrencies(SUPPORTED_WITHOUT_COP);
      mockedUseUsdToFiatRate.mockReturnValue({ status: "loading", rate: null });
      mockMarketData([createMarketCurrencyData({ id: "bitcoin" })]);

      const { result } = renderWithCop();

      expect(result.current.marketData).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it("surfaces an error when the rate request fails", () => {
      mockSupportedCounterCurrencies(SUPPORTED_WITHOUT_COP);
      mockedUseUsdToFiatRate.mockReturnValue({ status: "error", rate: null });
      mockMarketData([createMarketCurrencyData({ id: "bitcoin" })]);

      const { result } = renderWithCop();

      expect(result.current.marketData).toEqual([]);
      expect(result.current.isError).toBe(true);
    });

    it("requests the counter value natively once it is known to be supported", () => {
      mockSupportedCounterCurrencies(["usd", "eur", "cop"]);
      mockMarketData([createMarketCurrencyData({ id: "bitcoin", price: 100 })]);

      const { result } = renderWithCop();

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ counterCurrency: "cop" }),
        expect.objectContaining({ enabled: true }),
      );
      // No USD->fiat conversion request fires for a natively supported counter value.
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: false });
      expect(result.current.marketData[0].price).toBe(100);
    });

    it("requests BTC counter values in USD and rescales by the USD->BTC rate when BTC is not natively supported", () => {
      mockSupportedCounterCurrencies(["usd", "eur"]);
      mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.00001 });
      mockMarketData([createMarketCurrencyData({ id: "bitcoin", price: 100, marketcap: 200 })]);

      const { result } = renderWithCounterValue("BTC");

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ counterCurrency: "usd" }),
        expect.objectContaining({ enabled: true }),
      );
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("btc", { skip: false });
      expect(result.current.marketData[0].price).toBe(0.001);
      expect(result.current.marketData[0].marketcap).toBe(0.002);
      expect(result.current.marketParams.counterCurrency).toBe("btc");
    });
  });
});
