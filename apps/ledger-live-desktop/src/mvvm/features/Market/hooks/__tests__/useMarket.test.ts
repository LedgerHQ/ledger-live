import { act, renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import {
  KeysPriceChange,
  type MarketCurrencyData,
  Order,
} from "@ledgerhq/live-common/market/utils/types";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { createMockMarketListResult } from "@ledgerhq/live-common/market/utils/fixtures";
import { useMarket } from "../useMarket";
import { addStarredMarketCoins } from "~/renderer/actions/settings";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "@shared/analytics";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useUsdToFiatRate: jest.fn(() => ({ status: "ready", rate: 2 })),
}));

const mockedUseMarketData = jest.mocked(useMarketData);
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

  describe("counter value falls back to USD outside the chart allowlist", () => {
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

    it("requests USD and rescales a fiat outside the chart allowlist", async () => {
      mockMarketData([createMarketCurrencyData({ id: "bitcoin", price: 100, marketcap: 200 })]);

      const { result } = renderWithCounterValue("COP");

      await waitFor(() => {
        expect(mockedUseMarketData).toHaveBeenLastCalledWith(
          expect.objectContaining({ counterCurrency: "usd" }),
          expect.anything(),
        );
      });
      expect(result.current.marketData[0].price).toBe(200);
      expect(result.current.marketData[0].marketcap).toBe(400);
      expect(result.current.marketParams.counterCurrency).toBe("cop");
    });

    it("requests USD and rescales a crypto counter value", () => {
      mockMarketData([createMarketCurrencyData({ id: "bitcoin", price: 100, marketcap: 200 })]);

      const { result } = renderWithCounterValue("bitcoin");

      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ counterCurrency: "usd" }),
        expect.anything(),
      );
      expect(result.current.marketData[0].price).toBe(200);
      expect(result.current.marketData[0].marketcap).toBe(400);
      expect(result.current.marketParams.counterCurrency).toBe("btc");
    });
  });
});
