import { renderHook, act } from "@tests/test-renderer";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { ScreenName } from "~/const";
import { useGlobalSearchViewModel } from "../useGlobalSearchViewModel";
import { useGlobalSearchDefaults } from "LLM/features/GlobalSearch/hooks/useGlobalSearchDefaults";
import {
  useGlobalSearchResults,
  type GlobalSearchResults,
} from "LLM/features/GlobalSearch/hooks/useGlobalSearchResults";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockOpenFromMarket = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({ params: { source: "Portfolio" } }),
}));

jest.mock("LLM/features/AssetDetail/hooks/useAssetDetailNavigation", () => ({
  useAssetDetailNavigation: () => ({ openFromMarket: mockOpenFromMarket }),
}));

jest.mock("LLM/features/GlobalSearch/hooks/useGlobalSearchDefaults");
jest.mock("LLM/features/GlobalSearch/hooks/useGlobalSearchResults");

const mockedDefaults = jest.mocked(useGlobalSearchDefaults);
const mockedResults = jest.mocked(useGlobalSearchResults);

const EMPTY_SECTIONS = { cryptos: [], stocks: [] };

const resultsState = (overrides: Partial<GlobalSearchResults> = {}): GlobalSearchResults => ({
  search: "",
  setSearch: jest.fn(),
  clearSearch: jest.fn(),
  isSearchActive: false,
  searchResults: [],
  isLoadingSearch: false,
  hasNoResults: false,
  hasError: false,
  ...overrides,
});

describe("useGlobalSearchViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDefaults.mockReturnValue({
      defaultSections: EMPTY_SECTIONS,
      isLoadingDefaults: false,
      hasError: false,
    });
    mockedResults.mockReturnValue(resultsState());
  });

  it("composes default sections and search results from the data hooks", () => {
    const cryptos = [{ id: "btc" }] as never;
    const searchResults = [{ id: "eth" }] as never;
    mockedDefaults.mockReturnValue({
      defaultSections: { ...EMPTY_SECTIONS, cryptos },
      isLoadingDefaults: true,
      hasError: false,
    });
    mockedResults.mockReturnValue(resultsState({ searchResults, isLoadingSearch: true }));

    const { result } = renderHook(() => useGlobalSearchViewModel());

    expect(result.current.defaultSections.cryptos).toBe(cryptos);
    expect(result.current.isLoadingDefaults).toBe(true);
    expect(result.current.searchResults).toBe(searchResults);
    expect(result.current.isLoadingSearch).toBe(true);
  });

  it("surfaces the defaults error when no search is active", () => {
    mockedDefaults.mockReturnValue({
      defaultSections: EMPTY_SECTIONS,
      isLoadingDefaults: false,
      hasError: true,
    });

    const { result } = renderHook(() => useGlobalSearchViewModel());

    expect(result.current.hasError).toBe(true);
  });

  it("surfaces the search error when a search is active", () => {
    mockedResults.mockReturnValue(resultsState({ isSearchActive: true, hasError: true }));

    const { result } = renderHook(() => useGlobalSearchViewModel());

    expect(result.current.hasError).toBe(true);
  });

  it("enables default fetching while no search is active", () => {
    mockedResults.mockReturnValue(resultsState({ isSearchActive: false }));

    renderHook(() => useGlobalSearchViewModel());

    expect(mockedDefaults).toHaveBeenLastCalledWith(true);
  });

  it("disables default fetching while a search is active", () => {
    mockedResults.mockReturnValue(resultsState({ isSearchActive: true }));

    renderHook(() => useGlobalSearchViewModel());

    expect(mockedDefaults).toHaveBeenLastCalledWith(false);
  });

  it("tracks search_open on mount", () => {
    renderHook(() => useGlobalSearchViewModel());

    expect(track).toHaveBeenCalledWith("search_open", { page: ScreenName.GlobalSearch });
  });

  it("registers GlobalSearch as the current route so it is the source of the next screen", () => {
    currentRouteNameRef.current = "Portfolio";

    renderHook(() => useGlobalSearchViewModel());

    expect(currentRouteNameRef.current).toBe(ScreenName.GlobalSearch);
  });

  it("navigates back when onBack is invoked", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() => result.current.onBack());

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("tracks button_clicked with the section category when onSeeAll is invoked", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() => result.current.onSeeAll("crypto"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "See all",
      page: ScreenName.GlobalSearch,
      category: "crypto",
    });
  });

  it("opens the Market list on the all category from the Cryptos header", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() => result.current.onSeeAll("crypto"));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketList, { category: "all" });
  });

  it("opens the Market list on the stocks category from the Stocks header", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() => result.current.onSeeAll("stocks"));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MarketList, { category: "stocks" });
  });

  it("opens asset detail and tracks asset_clicked from a tapped result row", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() =>
      result.current.onAssetPress({
        id: "bitcoin",
        name: "Bitcoin",
        ledgerIds: ["bitcoin"],
      } as never),
    );

    expect(track).toHaveBeenCalledWith("asset_clicked", {
      asset: "Bitcoin",
      page: ScreenName.GlobalSearch,
      flow: "global_search",
      searched: false,
      source: "Portfolio",
    });
    expect(mockOpenFromMarket).toHaveBeenCalledWith({
      marketCurrencyId: "bitcoin",
      ledgerCurrencyIds: ["bitcoin"],
      source: ScreenName.GlobalSearch,
    });
  });

  it("marks the asset as searched when a search is active", () => {
    mockedResults.mockReturnValue(resultsState({ isSearchActive: true }));
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() =>
      result.current.onAssetPress({
        id: "bitcoin",
        name: "Bitcoin",
        ledgerIds: ["bitcoin"],
      } as never),
    );

    expect(track).toHaveBeenCalledWith(
      "asset_clicked",
      expect.objectContaining({ asset: "Bitcoin", searched: true }),
    );
  });

  it("opens asset detail and tracks asset_clicked from a tapped stock pill", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() =>
      result.current.onStockPress({
        id: "aapl",
        name: "Apple",
        navigationId: "aapl-market",
        ledgerId: "aapl-ledger",
      } as never),
    );

    expect(track).toHaveBeenCalledWith("asset_clicked", {
      asset: "Apple",
      page: ScreenName.GlobalSearch,
      flow: "global_search",
      searched: false,
      source: "Portfolio",
    });
    expect(mockOpenFromMarket).toHaveBeenCalledWith({
      marketCurrencyId: "aapl-market",
      ledgerCurrencyIds: ["aapl-ledger"],
      source: ScreenName.GlobalSearch,
    });
  });
});
