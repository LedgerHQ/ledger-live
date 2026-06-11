import { renderHook, act } from "@tests/test-renderer";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { useGlobalSearchViewModel } from "../useGlobalSearchViewModel";
import { useGlobalSearchDefaults } from "../useGlobalSearchDefaults";
import { useGlobalSearchResults, type GlobalSearchResults } from "../useGlobalSearchResults";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockOpenFromMarket = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}));

jest.mock("LLM/features/AssetDetail/hooks/useAssetDetailNavigation", () => ({
  useAssetDetailNavigation: () => ({ openFromMarket: mockOpenFromMarket }),
}));

jest.mock("../useGlobalSearchDefaults");
jest.mock("../useGlobalSearchResults");

const mockedDefaults = jest.mocked(useGlobalSearchDefaults);
const mockedResults = jest.mocked(useGlobalSearchResults);

const EMPTY_SECTIONS = { cryptos: [], stablecoins: [], stocks: [] };

const resultsState = (overrides: Partial<GlobalSearchResults> = {}): GlobalSearchResults => ({
  search: "",
  setSearch: jest.fn(),
  clearSearch: jest.fn(),
  isSearchActive: false,
  searchResults: [],
  isLoadingSearch: false,
  hasNoResults: false,
  ...overrides,
});

describe("useGlobalSearchViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDefaults.mockReturnValue({ defaultSections: EMPTY_SECTIONS, isLoadingDefaults: false });
    mockedResults.mockReturnValue(resultsState());
  });

  it("composes default sections and search results from the data hooks", () => {
    const cryptos = [{ id: "btc" }] as never;
    const searchResults = [{ id: "eth" }] as never;
    mockedDefaults.mockReturnValue({
      defaultSections: { ...EMPTY_SECTIONS, cryptos },
      isLoadingDefaults: true,
    });
    mockedResults.mockReturnValue(resultsState({ searchResults, isLoadingSearch: true }));

    const { result } = renderHook(() => useGlobalSearchViewModel());

    expect(result.current.defaultSections.cryptos).toBe(cryptos);
    expect(result.current.isLoadingDefaults).toBe(true);
    expect(result.current.searchResults).toBe(searchResults);
    expect(result.current.isLoadingSearch).toBe(true);
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

    expect(track).toHaveBeenCalledWith("search_open");
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

  it("does not navigate from the Stablecoins header (no Market category yet)", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() => result.current.onSeeAll("stable"));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens asset detail from a tapped result row", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() => result.current.onAssetPress({ id: "bitcoin", ledgerIds: ["bitcoin"] } as never));

    expect(mockOpenFromMarket).toHaveBeenCalledWith({
      marketCurrencyId: "bitcoin",
      ledgerCurrencyIds: ["bitcoin"],
      source: ScreenName.GlobalSearch,
    });
  });

  it("opens asset detail from a tapped stock pill", () => {
    const { result } = renderHook(() => useGlobalSearchViewModel());

    act(() =>
      result.current.onStockPress({
        id: "aapl",
        navigationId: "aapl-market",
        ledgerId: "aapl-ledger",
      } as never),
    );

    expect(mockOpenFromMarket).toHaveBeenCalledWith({
      marketCurrencyId: "aapl-market",
      ledgerCurrencyIds: ["aapl-ledger"],
      source: ScreenName.GlobalSearch,
    });
  });
});
