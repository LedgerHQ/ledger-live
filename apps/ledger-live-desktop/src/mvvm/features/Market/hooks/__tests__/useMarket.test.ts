import { act, renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import {
  KeysPriceChange,
  type MarketCurrencyData,
  Order,
} from "@ledgerhq/live-common/market/utils/types";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useSupportedCounterCurrencies } from "@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { useMarket } from "../useMarket";
import { addStarredMarketCoins } from "~/renderer/actions/settings";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider");
jest.mock("@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate");

jest.mock("~/renderer/hooks/useInitSupportedCounterValues", () => ({
  useInitSupportedCounterValues: jest.fn(),
}));

const mockedUseMarketData = jest.mocked(useMarketData);
const mockedUseSupportedCounterCurrencies = jest.mocked(useSupportedCounterCurrencies);
const mockedUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);

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
  mockedUseMarketData.mockReturnValue({
    data,
    isLoading: false,
    isPending: false,
    isFetching: false,
    isError: false,
    cachedMetadataMap: new Map(),
  } as unknown as ReturnType<typeof useMarketData>);

const mockSupportedCounterCurrencies = (supportedCounterCurrencies?: string[]) =>
  mockedUseSupportedCounterCurrencies.mockReturnValue({
    data: supportedCounterCurrencies,
  } as unknown as ReturnType<typeof useSupportedCounterCurrencies>);

const createMarketState = (starred: string[] = []) => ({
  marketParams: {
    starred,
    range: "24h",
    limit: 50,
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "USD",
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
    it("uses starredMarketCoins when filter is active", () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin", "ethereum"]),
        market: createMarketState(["bitcoin", "ethereum"]),
      };

      const { result } = renderHook(() => useMarket(), {
        initialState,
      });

      expect(result.current.starFilterOn).toBe(true);
      expect(result.current.starredMarketCoins).toEqual(["bitcoin", "ethereum"]);
    });

    it("starFilterOn is false when marketParams.starred is empty", () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin"]),
        market: createMarketState([]),
      };

      const { result } = renderHook(() => useMarket(), {
        initialState,
      });

      expect(result.current.starFilterOn).toBe(false);
    });

    it("updates starredMarketCoins when a coin is added", async () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin"]),
        market: createMarketState(["bitcoin"]),
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

    it("toggles starred filter on and off correctly", async () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin", "ethereum"]),
        market: createMarketState([]),
      };

      const { result } = renderHook(() => useMarket(), {
        initialState,
      });

      expect(result.current.starFilterOn).toBe(false);

      await act(async () => {
        result.current.toggleFilterByStarredAccounts();
      });

      await waitFor(() => {
        expect(result.current.starFilterOn).toBe(true);
      });

      expect(result.current.marketParams.starred).toEqual(["bitcoin", "ethereum"]);

      await act(async () => {
        result.current.toggleFilterByStarredAccounts();
      });

      await waitFor(() => {
        expect(result.current.starFilterOn).toBe(false);
      });

      expect(result.current.marketParams.starred).toEqual([]);
    });

    it("toggleStar adds and removes coins from starredMarketCoins", async () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState(["bitcoin"]),
        market: createMarketState([]),
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
          market: createMarketState([]),
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

  describe("category (asset discoverability)", () => {
    const withAssetDiscoverability = withFlagOverrides({
      lldRefreshMarketData: { enabled: false },
      lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
    });

    const marketStateWithCategory = (category: "all" | "starred" | "stocks") => ({
      ...createMarketState([]),
      category,
    });

    it("shows the favorites empty state when the starred category has no coins", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...withAssetDiscoverability,
          settings: createSettingsState([]),
          market: marketStateWithCategory("starred"),
        },
      });

      expect(result.current.starFilterOn).toBe(true);
      expect(result.current.emptyState).toBe("favorites");
      expect(result.current.marketData).toEqual([]);
    });

    it("enables the starred filter without an empty state when favorites exist", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...withAssetDiscoverability,
          settings: createSettingsState(["bitcoin"]),
          market: marketStateWithCategory("starred"),
        },
      });

      expect(result.current.starFilterOn).toBe(true);
      expect(result.current.emptyState).toBeUndefined();
    });

    it("does not flag an empty state for the stocks category", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...withAssetDiscoverability,
          settings: createSettingsState([]),
          market: marketStateWithCategory("stocks"),
        },
      });

      expect(result.current.emptyState).toBeUndefined();
      expect(result.current.marketData).toEqual([]);
    });
  });

  describe("pagination reset", () => {
    it("resets page and currentPage when sort order changes", async () => {
      const initialState = {
        ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
        settings: createSettingsState([]),
        market: {
          ...createMarketState([]),
          marketParams: { ...createMarketState([]).marketParams, page: 3 },
          currentPage: 3,
        },
      };

      const { result } = renderHook(() => useMarket(), { initialState });

      await act(async () => {
        result.current.toggleSortBy();
      });

      expect(result.current.marketParams.page).toBe(1);
      expect(result.current.marketCurrentPage).toBe(1);
    });
  });

  describe("time range options", () => {
    it("exposes full-label range options ordered shortest to longest", () => {
      const { result } = renderHook(() => useMarket(), {
        initialState: {
          ...withFlagOverrides({ lldRefreshMarketData: { enabled: false } }),
          settings: createSettingsState([]),
          market: createMarketState([]),
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
            lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
          }),
          settings: { ...SETTINGS_INITIAL_STATE, counterValue, starredMarketCoins: [] },
          market: createMarketState([]),
        },
      });
    const renderWithCop = () => renderWithCounterValue("COP");

    it("disables the market request while counter value support is unresolved", () => {
      mockSupportedCounterCurrencies(undefined);

      const { result } = renderWithCop();

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ counterCurrency: "cop" }),
        { enabled: false },
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
        { enabled: true },
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
        { enabled: true },
      );
      // No USD->fiat conversion request fires for a natively supported counter value.
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: false });
      expect(result.current.marketData[0].price).toBe(100);
    });

    it("requests crypto counter values in USD and rescales by the USD->BTC rate", () => {
      mockSupportedCounterCurrencies(undefined);
      mockedUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.00001 });
      mockMarketData([createMarketCurrencyData({ id: "bitcoin", price: 100, marketcap: 200 })]);

      const { result } = renderWithCounterValue("BTC");

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ counterCurrency: "usd" }),
        { enabled: true },
      );
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("btc", { skip: false });
      expect(result.current.marketData[0].price).toBe(0.001);
      expect(result.current.marketData[0].marketcap).toBe(0.002);
      expect(result.current.marketParams.counterCurrency).toBe("btc");
    });
  });
});
