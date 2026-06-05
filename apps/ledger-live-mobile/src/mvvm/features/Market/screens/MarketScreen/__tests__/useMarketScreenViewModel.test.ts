import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import type { State } from "~/reducers/types";
import { createMarketAssetDisplayData } from "../../../__tests__/helpers";
import { useMarketAssets } from "../useMarketAssets";
import { useMarketScreenViewModel } from "../useMarketScreenViewModel";

jest.mock("~/analytics", () => ({ track: jest.fn() }));

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

function mockMarketAssets(overrides: Partial<ReturnType<typeof useMarketAssets>> = {}) {
  mockedUseMarketAssets.mockReturnValue({
    assets: [createMarketAssetDisplayData()],
    loading: false,
    loadingMore: false,
    isError: false,
    emptyState: undefined,
    onEndReached: jest.fn(),
    ...overrides,
  });
}

describe("useMarketScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("forwards the assets and their loading / error flags", () => {
    mockMarketAssets({ loading: true, loadingMore: true, isError: false });
    const { result } = renderHook(() => useMarketScreenViewModel());
    expect(result.current.assetsList.assets).toHaveLength(1);
    expect(result.current.assetsList.assetsLoading).toBe(true);
    expect(result.current.assetsList.assetsLoadingMore).toBe(true);
    expect(result.current.assetsList.assetsError).toBe(false);
  });

  it("tracks the tap and navigates to the asset detail on press", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.assetsList.onAssetPress(result.current.assetsList.assets[0]));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "asset",
      currency: "BTC",
      page: "Market",
    });
    expect(openFromMarket).toHaveBeenCalledWith({
      marketCurrencyId: "bitcoin",
      ledgerCurrencyIds: ["bitcoin"],
      source: "Market",
    });
  });

  it("collapses sections immediately and debounces the asset search query", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useMarketScreenViewModel());

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      search: "",
      category: "all",
      starredMarketCoins: [],
    });

    act(() => result.current.search.onChangeText("eth"));

    expect(result.current.isSearchActive).toBe(true);
    expect(result.current.assetsList.assets).toEqual([]);
    expect(result.current.assetsList.assetsLoading).toBe(true);
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      search: "",
      category: "all",
      starredMarketCoins: [],
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      search: "eth",
      category: "all",
      starredMarketCoins: [],
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
      search: "btc",
      category: "all",
      starredMarketCoins: [],
    });

    act(() => result.current.search.onClear());

    expect(result.current.search.value).toBe("");
    expect(result.current.isSearchActive).toBe(false);
    expect(result.current.assetsList.assets).toHaveLength(1);
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      search: "",
      category: "all",
      starredMarketCoins: [],
    });
  });

  it("forwards the selected category and starred ids to the assets hook", () => {
    const starredMarketCoins = ["bitcoin"];

    const { result } = renderHook(() => useMarketScreenViewModel(), {
      overrideInitialState: (state: State): State => ({
        ...state,
        settings: { ...state.settings, starredMarketCoins },
        marketListConfig: { ...state.marketListConfig, category: "starred" },
      }),
    });

    expect(result.current.assetsList.categories.selectedCategory).toBe("starred");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      search: "",
      category: "starred",
      starredMarketCoins,
    });
  });

  it("tracks the stocks category tap without selecting it yet", () => {
    const { result, store } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.assetsList.categories.onSelectCategory("stocks"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "category",
      category: "stocks",
      page: "Market",
    });
    expect(store.getState().marketListConfig.category).toBe("all");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      search: "",
      category: "all",
      starredMarketCoins: [],
    });
  });

  it("tracks and persists the favorites category", () => {
    const { result, store } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.assetsList.categories.onSelectCategory("starred"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "category",
      category: "starred",
      page: "Market",
    });
    expect(store.getState().marketListConfig.category).toBe("starred");
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({
      search: "",
      category: "starred",
      starredMarketCoins: [],
    });
  });
});
