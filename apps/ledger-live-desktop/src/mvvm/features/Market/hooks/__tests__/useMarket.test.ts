import { act, renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { useMarket } from "../useMarket";
import { addStarredMarketCoins } from "~/renderer/actions/settings";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider", () => ({
  useMarketData: () => ({
    data: [],
    isLoading: false,
    cachedMetadataMap: new Map(),
  }),
}));

jest.mock("~/renderer/hooks/useInitSupportedCounterValues", () => ({
  useInitSupportedCounterValues: jest.fn(),
}));

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
});
