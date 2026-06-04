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

  it("exposes the highlight card layout", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());
    expect(result.current.cardWidth).toBeGreaterThan(0);
    expect(result.current.highlightCards.length).toBeGreaterThan(0);
  });

  it("forwards the assets and their loading / error flags", () => {
    mockMarketAssets({ loading: true, loadingMore: true, isError: false });
    const { result } = renderHook(() => useMarketScreenViewModel());
    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assetsLoading).toBe(true);
    expect(result.current.assetsLoadingMore).toBe(true);
    expect(result.current.assetsError).toBe(false);
  });

  it("tracks the tap and navigates to the asset detail on press", () => {
    const { result } = renderHook(() => useMarketScreenViewModel());

    act(() => result.current.onAssetPress(result.current.assets[0]));

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
});
