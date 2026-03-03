import { renderHook, act, waitFor } from "tests/testSetup";
import { server } from "tests/server";
import { http, HttpResponse } from "msw";
import { useMarketCoin } from "../useMarketCoin";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { MARKET_API, DADA_API, EMPTY_DADA_RESPONSE } from "./shared";

const mockOnBuy = jest.fn();
const mockOnSwap = jest.fn();
const mockOnStake = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: jest.fn(() => ({ currencyId: "bitcoin" })),
}));

jest.mock("~/renderer/getCurrencyColor", () => ({
  getCurrencyColor: jest.fn(() => "#FF9900"),
}));

jest.mock("../useMarketActions", () => ({
  Page: { Market: "Page Market", MarketCoin: "Page Market Coin" },
  useMarketActions: () => ({
    onBuy: mockOnBuy,
    onSwap: mockOnSwap,
    onStake: mockOnStake,
    availableOnBuy: true,
    availableOnSwap: true,
    availableOnStake: false,
  }),
}));

const { useParams } = jest.requireMock("react-router");
const { getCurrencyColor } = jest.requireMock("~/renderer/getCurrencyColor");

const createMarketState = (overrides = {}) => ({
  marketParams: {
    starred: [],
    range: "24h",
    limit: 50,
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "usd",
    ...overrides,
  },
  currentPage: 1,
});

const createSettingsState = (starredMarketCoins: string[] = []) => ({
  starredMarketCoins,
  overriddenFeatureFlags: {
    lldRefreshMarketData: { enabled: false },
  },
});

const defaultStarredMarketCoins: string[] = [];

const renderMarketCoinHook = ({
  marketOverrides = {},
  starredMarketCoins = defaultStarredMarketCoins,
} = {}) =>
  renderHook(() => useMarketCoin(), {
    minimal: false,
    initialState: {
      market: createMarketState(marketOverrides),
      settings: createSettingsState(starredMarketCoins),
    },
  });

describe("useMarketCoin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ currencyId: "bitcoin" });
  });

  it("should return isStarred=true when currencyId is in starredMarketCoins", () => {
    const { result } = renderMarketCoinHook({ starredMarketCoins: ["bitcoin"] });

    expect(result.current.isStarred).toBe(true);
  });

  it("should return isStarred=false when currencyId is NOT in starredMarketCoins", () => {
    const { result } = renderMarketCoinHook();

    expect(result.current.isStarred).toBe(false);
  });

  it("should return isStarred=false when currencyId is undefined", () => {
    useParams.mockReturnValue({});

    const { result } = renderMarketCoinHook({ starredMarketCoins: ["bitcoin"] });

    expect(result.current.isStarred).toBe(false);
  });

  it("should dispatch removeStarredMarketCoins when coin is starred", async () => {
    const { result, store } = renderMarketCoinHook({ starredMarketCoins: ["bitcoin"] });

    await waitFor(() => {
      expect(result.current.currency).toBeDefined();
    });

    await act(async () => {
      result.current.toggleStar();
    });

    expect(store.getState().settings.starredMarketCoins).not.toContain("bitcoin");
  });

  it("should dispatch addStarredMarketCoins when coin is not starred", async () => {
    const { result, store } = renderMarketCoinHook();

    await waitFor(() => {
      expect(result.current.currency).toBeDefined();
    });

    await act(async () => {
      result.current.toggleStar();
    });

    expect(store.getState().settings.starredMarketCoins).toContain("bitcoin");
  });

  it("should be no-op when currency data is unavailable", async () => {
    server.use(http.get(MARKET_API, () => HttpResponse.json(null, { status: 404 })));

    const { result, store } = renderMarketCoinHook();

    await waitFor(() => {
      expect(result.current.isLoadingCurrency).toBe(false);
    });

    act(() => {
      result.current.toggleStar();
    });

    expect(store.getState().settings.starredMarketCoins).toEqual([]);
  });

  it("should dispatch setMarketOptions with new range", async () => {
    const { result, store } = renderMarketCoinHook();

    await act(async () => {
      result.current.changeRange("7d");
    });

    expect(store.getState().market.marketParams.range).toBe("7d");
  });

  it("should use supported currency when available", async () => {
    const { result, store } = renderMarketCoinHook();

    await waitFor(() => {
      expect(result.current.supportedCounterCurrencies).toBeDefined();
    });

    await act(async () => {
      result.current.changeCounterCurrency("EUR");
    });

    expect(store.getState().market.marketParams.counterCurrency).toBe("EUR");
  });

  it("should fall back to usd when currency is not supported", async () => {
    const { result, store } = renderMarketCoinHook();

    await waitFor(() => {
      expect(result.current.supportedCounterCurrencies).toBeDefined();
    });

    await act(async () => {
      result.current.changeCounterCurrency("XYZ");
    });

    expect(store.getState().market.marketParams.counterCurrency).toBe("usd");
  });

  it("should use getCurrencyColor when ledgerCurrency exists", async () => {
    const { result } = renderMarketCoinHook();

    await waitFor(() => {
      expect(result.current.color).toBe("#FF9900");
    });

    expect(getCurrencyColor).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bitcoin" }),
      expect.any(String),
    );
  });

  it("should fall back to primary color when ledgerCurrency is undefined", async () => {
    server.use(http.get(DADA_API, () => HttpResponse.json(EMPTY_DADA_RESPONSE)));

    const { result } = renderMarketCoinHook();

    await waitFor(() => {
      expect(result.current.isLoadingCurrency).toBe(false);
    });

    expect(result.current.color).toBe("#BBB0FF");
  });

  it("should return dataChart and isLoadingDataChart from useCurrencyChartData", async () => {
    const { result } = renderMarketCoinHook();

    await waitFor(() => {
      expect(result.current.isLoadingDataChart).toBe(false);
    });

    expect(result.current.dataChart).toEqual({
      "24h": [
        [1700000000000, 50000],
        [1700003600000, 50100],
      ],
    });
  });

  it("should return isLoadingCurrency while data is fetching", async () => {
    const { result } = renderMarketCoinHook();

    expect(result.current.isLoadingCurrency).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingCurrency).toBe(false);
    });
  });

  it("should pass through availability flags from useMarketActions", () => {
    const { result } = renderMarketCoinHook();

    expect(result.current.availableOnBuy).toBe(true);
    expect(result.current.availableOnSwap).toBe(true);
    expect(result.current.availableOnStake).toBe(false);
  });

  it("should return counterCurrency and range from Redux state", () => {
    const { result } = renderMarketCoinHook({
      marketOverrides: { counterCurrency: "eur", range: "7d" },
    });

    expect(result.current.counterCurrency).toBe("eur");
    expect(result.current.range).toBe("7d");
  });
});
