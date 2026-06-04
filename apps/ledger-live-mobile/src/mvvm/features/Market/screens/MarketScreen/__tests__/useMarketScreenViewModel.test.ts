import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
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

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({ search: "" });

    act(() => result.current.search.onChangeText("eth"));

    expect(result.current.isSearchActive).toBe(true);
    expect(result.current.assetsList.assets).toEqual([]);
    expect(result.current.assetsList.assetsLoading).toBe(true);
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({ search: "" });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({ search: "eth" });
  });

  it("restores the full asset list immediately when search is cleared", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.search.onChangeText("btc"));
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({ search: "btc" });

    act(() => result.current.search.onClear());

    expect(result.current.search.value).toBe("");
    expect(result.current.isSearchActive).toBe(false);
    expect(result.current.assetsList.assets).toHaveLength(1);
    expect(mockedUseMarketAssets).toHaveBeenLastCalledWith({ search: "" });
  });
});
