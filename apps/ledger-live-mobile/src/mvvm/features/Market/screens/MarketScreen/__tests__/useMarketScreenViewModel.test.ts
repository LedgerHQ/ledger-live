import { useRoute } from "@react-navigation/native";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { track } from "~/analytics";
import { createMarketAssetDisplayData } from "../../../__tests__/helpers";
import { useMarketAssets } from "../useMarketAssets";
import { useMarketScreenViewModel } from "../useMarketScreenViewModel";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";

jest.mock("~/analytics", () => ({ track: jest.fn() }));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn(),
}));

const openFromMarket = jest.fn();
jest.mock("LLM/features/AssetDetail/hooks/useAssetDetailNavigation", () => ({
  useAssetDetailNavigation: () => ({
    openFromMarket,
    openFromAsset: jest.fn(),
    hideNetwork: false,
  }),
}));

jest.mock("../useMarketAssets");
const mockedUseMarketAssets = jest.mocked(useMarketAssets);
const mockedUseRoute = jest.mocked(useRoute);

function mockMarketListRoute(category?: unknown) {
  mockedUseRoute.mockReturnValue({
    key: ScreenName.MarketList,
    name: ScreenName.MarketList,
    params: category === undefined ? undefined : { category },
  });
}

function mockMarketAssets(overrides: Partial<ReturnType<typeof useMarketAssets>> = {}) {
  mockedUseMarketAssets.mockReturnValue({
    assets: [createMarketAssetDisplayData()],
    loading: false,
    isFetchingNextPage: false,
    isError: false,
    emptyState: undefined,
    onEndReached: jest.fn(),
    ...overrides,
  });
}

function withAssetDiscoverability(enabled: boolean, baseTransform?: (state: State) => State) {
  return {
    overrideInitialState: withFlagOverrides(
      { lwmWallet40: { enabled: true, params: { assetDiscoverability: enabled } } },
      baseTransform,
    ),
  };
}

const defaultMarketAssetsParams = {
  search: "",
  category: "all",
  sorting: "marketCap",
  timeframe: "1D",
  starredMarketCoins: [],
};

describe("useMarketScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketListRoute();
    mockMarketAssets();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("exposes the highlight card layout", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());
    expect(result.current.highlights.cardWidth).toBeGreaterThan(0);
    expect(result.current.highlights.highlightCards.length).toBeGreaterThan(0);
  });

  it("forwards the assets and their loading / fetching / error flags", () => {
    mockMarketAssets({ loading: true, isFetchingNextPage: true, isError: false });
    const { result } = renderHook(() => useMarketScreenViewModel());
    expect(result.current.assetsList.assets).toHaveLength(1);
    expect(result.current.assetsList.assetsLoading).toBe(true);
    expect(result.current.assetsList.assetsFetchingNextPage).toBe(true);
    expect(result.current.assetsList.assetsError).toBe(false);
  });

  it("tracks the tap and navigates to the asset detail on press", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.assetsList.onAssetPress(result.current.assetsList.assets[0]));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "asset",
      currency: "BTC",
      page: "Market",
      category: "all",
    });
    expect(openFromMarket).toHaveBeenCalledWith({
      marketCurrencyId: "bitcoin",
      ledgerCurrencyIds: ["bitcoin"],
      source: "Market",
    });
  });

  it("does not navigate to asset detail when the asset cannot be resolved", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() =>
      result.current.assetsList.onAssetPress({
        ...result.current.assetsList.assets[0],
        ledgerIds: [],
      }),
    );

    expect(track).not.toHaveBeenCalled();
    expect(openFromMarket).not.toHaveBeenCalled();
  });

  it("collapses sections immediately and debounces the asset search query", () => {
    jest.useFakeTimers();
    mockMarketAssets({ isFetchingNextPage: true });
    const { result } = renderHook(() => useMarketScreenViewModel());

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith(defaultMarketAssetsParams);

    act(() => result.current.search.onChangeText("eth"));

    expect(result.current.isSearchActive).toBe(true);
    expect(result.current.assetsList.assets).toEqual([]);
    expect(result.current.assetsList.assetsLoading).toBe(true);
    // The footer spinner must stay hidden while the new query is debouncing.
    expect(result.current.assetsList.assetsFetchingNextPage).toBe(false);
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith(defaultMarketAssetsParams);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      ...defaultMarketAssetsParams,
      search: "eth",
    });
  });

  it("restores the full asset list immediately when search is cleared", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.search.onChangeText("btc"));
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      ...defaultMarketAssetsParams,
      search: "btc",
    });

    act(() => result.current.search.onClear());

    expect(result.current.search.value).toBe("");
    expect(result.current.isSearchActive).toBe(false);
    expect(result.current.assetsList.assets).toHaveLength(1);
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith(defaultMarketAssetsParams);
  });

  it("forwards the selected category and starred ids to the assets hook", () => {
    const starredMarketCoins = ["bitcoin"];
    mockMarketListRoute("starred");

    const { result } = renderHook(
      () => useMarketScreenViewModel(),
      withAssetDiscoverability(
        true,
        (state: State): State => ({
          ...state,
          settings: { ...state.settings, starredMarketCoins },
        }),
      ),
    );

    expect(result.current.assetsList.categories.selectedCategory).toBe("starred");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      ...defaultMarketAssetsParams,
      category: "starred",
      starredMarketCoins,
    });
  });

  it("forwards sorting and timeframe filters to the assets hook", () => {
    const { result } = renderHook(() => useMarketScreenViewModel(), {
      overrideInitialState: (state: State): State => ({
        ...state,
        marketListConfig: { ...state.marketListConfig, sorting: "losers", timeframe: "30D" },
      }),
    });

    expect(result.current.assetsList.filters.sorting).toBe("losers");
    expect(result.current.assetsList.filters.timeframe).toBe("30D");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      ...defaultMarketAssetsParams,
      sorting: "losers",
      timeframe: "30D",
    });
  });

  it("exposes the default page tracking properties", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());

    expect(result.current.pageTracking).toEqual({
      sortVolume: "desc",
      sortMarketCap: "desc",
      sortChange: "desc",
      timeframe: "1D",
      category: "all",
    });
  });

  it("maps the active sorting and starred category into the page tracking properties", () => {
    mockMarketListRoute("starred");

    const { result } = renderHook(
      () => useMarketScreenViewModel(),
      withAssetDiscoverability(
        true,
        (state: State): State => ({
          ...state,
          marketListConfig: { ...state.marketListConfig, sorting: "losers", timeframe: "7D" },
        }),
      ),
    );

    expect(result.current.pageTracking).toEqual({
      sortVolume: "desc",
      sortMarketCap: "desc",
      sortChange: "asc",
      timeframe: "7D",
      category: "favorites",
    });
  });

  it("tracks and applies the stocks category", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.assetsList.categories.onSelectCategory("stocks"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "category",
      category: "stocks",
      page: "Market",
    });
    expect(result.current.assetsList.categories.selectedCategory).toBe("stocks");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      ...defaultMarketAssetsParams,
      category: "stocks",
    });
  });

  it("tracks and applies the favorites category", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.assetsList.categories.onSelectCategory("starred"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "category",
      category: "starred",
      page: "Market",
    });
    expect(result.current.assetsList.categories.selectedCategory).toBe("starred");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      ...defaultMarketAssetsParams,
      category: "starred",
    });
  });

  it("uses a valid route category as the initial category", () => {
    mockMarketListRoute("stocks");

    const { result } = renderHook(() => useMarketScreenViewModel(), withAssetDiscoverability(true));

    expect(result.current.assetsList.categories.selectedCategory).toBe("stocks");
  });

  it("supports the starred route category", () => {
    mockMarketListRoute("starred");

    const { result } = renderHook(() => useMarketScreenViewModel(), withAssetDiscoverability(true));

    expect(result.current.assetsList.categories.selectedCategory).toBe("starred");
  });

  it("allows switching category even when a category is pre-selected", () => {
    mockMarketListRoute("stocks");

    const { result } = renderHook(() => useMarketScreenViewModel(), withAssetDiscoverability(true));
    expect(result.current.assetsList.categories.selectedCategory).toBe("stocks");

    act(() => result.current.assetsList.categories.onSelectCategory("all"));

    expect(result.current.assetsList.categories.selectedCategory).toBe("all");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      ...defaultMarketAssetsParams,
      category: "all",
    });
  });

  it("defaults to the all category when there is no route category", () => {
    const { result } = renderHook(() => useMarketScreenViewModel(), withAssetDiscoverability(true));

    expect(result.current.assetsList.categories.selectedCategory).toBe("all");
  });

  it("defaults to the all category when the route category is invalid", () => {
    mockMarketListRoute("unknown");

    const { result } = renderHook(() => useMarketScreenViewModel(), withAssetDiscoverability(true));

    expect(result.current.assetsList.categories.selectedCategory).toBe("all");
  });

  it("ignores the route category when asset discoverability is disabled", () => {
    mockMarketListRoute("stocks");

    const { result } = renderHook(
      () => useMarketScreenViewModel(),
      withAssetDiscoverability(false),
    );

    expect(result.current.assetsList.categories.selectedCategory).toBe("all");
  });
});
