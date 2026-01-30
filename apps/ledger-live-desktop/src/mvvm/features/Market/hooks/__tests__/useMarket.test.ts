import { act, renderHook, waitFor } from "tests/testSetup";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { useMarket } from "../useMarket";
import { addStarredMarketCoins } from "~/renderer/actions/settings";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider", () => ({
  useMarketDataProvider: () => ({
    supportedCounterCurrencies: ["usd", "eur"],
  }),
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
  overriddenFeatureFlags: {
    lldRefreshMarketData: { enabled: false },
  },
});

describe("useMarket", () => {
  describe("starred filter", () => {
    it("uses starredMarketCoins when filter is active", () => {
      const initialState = {
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
  });
});
