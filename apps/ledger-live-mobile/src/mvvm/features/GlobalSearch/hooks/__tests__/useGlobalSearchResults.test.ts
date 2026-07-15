import { renderHook, act, withFlagOverrides } from "@tests/test-renderer";
import { setEnv } from "@ledgerhq/live-env";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { useGlobalSearchResults } from "../useGlobalSearchResults";

jest.mock("@ledgerhq/live-common/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));
jest.mock("@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate", () => ({
  useUsdToFiatRate: () => ({ rate: 1, status: "ready" }),
}));
jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData");
jest.mock("@ledgerhq/live-common/dada-client/utils/currencySelection");

const mockedAssets = jest.mocked(useAssetsData);
const mockedSelectCurrency = jest.mocked(selectCurrencyForMetaId);

const buildData = (ids: string[]) =>
  ({
    currenciesOrder: { metaCurrencyIds: ids, key: "marketCap", order: "desc" },
    cryptoAssets: Object.fromEntries(
      ids.map(id => [id, { id, name: id, ticker: id.toUpperCase(), assetsIds: { ethereum: id } }]),
    ),
    markets: Object.fromEntries(ids.map((id, i) => [id, { id, marketCapRank: i + 1, price: 1 }])),
  }) as never;

const buildDataOnNetwork = (network: string) =>
  ({
    currenciesOrder: { metaCurrencyIds: ["amdx"], key: "marketCap", order: "desc" },
    cryptoAssets: {
      amdx: {
        id: "amdx",
        name: "AMD",
        ticker: "AMDX",
        assetsIds: { [network]: `${network}/erc20/amd` },
      },
    },
    markets: { amdx: { id: "amdx", marketCapRank: 1, price: 1 } },
  }) as never;

describe("useGlobalSearchResults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSelectCurrency.mockImplementation((metaId: string) => ({ id: metaId }) as never);
    mockedAssets.mockReturnValue({ data: undefined, isLoading: false } as never);
  });

  afterEach(() => {
    setEnv("MANAGER_DEV_MODE", false);
  });

  it("is inactive with no results before typing", () => {
    const { result } = renderHook(() => useGlobalSearchResults());

    expect(result.current.isSearchActive).toBe(false);
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.hasNoResults).toBe(false);
  });

  it("fetches and maps results for the typed query", () => {
    mockedAssets.mockReturnValue({ data: buildData(["btc", "eth"]), isLoading: false } as never);

    const { result } = renderHook(() => useGlobalSearchResults());
    act(() => result.current.setSearch("b"));

    expect(result.current.isSearchActive).toBe(true);
    expect(result.current.searchResults.map(r => r.ticker)).toEqual(["BTC", "ETH"]);
    expect(mockedAssets).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "b", skip: false, includeTestNetworks: false }),
    );
  });

  it("includes testnets in the query only in developer mode", () => {
    setEnv("MANAGER_DEV_MODE", true);
    mockedAssets.mockReturnValue({ data: buildData(["btc"]), isLoading: false } as never);

    const { result } = renderHook(() => useGlobalSearchResults());
    act(() => result.current.setSearch("b"));

    expect(mockedAssets).toHaveBeenLastCalledWith(
      expect.objectContaining({ includeTestNetworks: true }),
    );
  });

  it("hides a result whose only network currency flag is off", () => {
    mockedAssets.mockReturnValue({
      data: buildDataOnNetwork("robinhood_testnet"),
      isLoading: false,
    } as never);

    const { result } = renderHook(() => useGlobalSearchResults());
    act(() => result.current.setSearch("amd"));

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.hasNoResults).toBe(true);
  });

  it("shows the result when its network currency flag is on", () => {
    mockedAssets.mockReturnValue({
      data: buildDataOnNetwork("robinhood_testnet"),
      isLoading: false,
    } as never);

    const { result } = renderHook(() => useGlobalSearchResults(), {
      overrideInitialState: withFlagOverrides({ currencyRobinhoodTestnet: { enabled: true } }),
    });
    act(() => result.current.setSearch("amd"));

    expect(result.current.searchResults).toHaveLength(1);
  });

  it("tracks search_query when the debounced query changes", () => {
    const { result } = renderHook(() => useGlobalSearchResults());

    act(() => result.current.setSearch("bitcoin"));

    expect(track).toHaveBeenCalledWith("search_query", {
      query: "bitcoin",
      page: ScreenName.GlobalSearch,
    });
  });

  it("flags hasNoResults when the query returns nothing", () => {
    mockedAssets.mockReturnValue({ data: buildData([]), isLoading: false } as never);

    const { result } = renderHook(() => useGlobalSearchResults());
    act(() => result.current.setSearch("zzz"));

    expect(result.current.hasNoResults).toBe(true);
  });

  it("reports loading while the search query is in flight", () => {
    mockedAssets.mockReturnValue({ data: undefined, isLoading: true } as never);

    const { result } = renderHook(() => useGlobalSearchResults());
    act(() => result.current.setSearch("btc"));

    expect(result.current.isLoadingSearch).toBe(true);
    expect(result.current.hasNoResults).toBe(false);
  });

  it("flags hasError (not hasNoResults) on an error response", () => {
    mockedAssets.mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);

    const { result } = renderHook(() => useGlobalSearchResults());
    act(() => result.current.setSearch("btc"));

    expect(result.current.hasNoResults).toBe(false);
    expect(result.current.hasError).toBe(true);
  });

  it("clears the search", () => {
    const { result } = renderHook(() => useGlobalSearchResults());

    act(() => result.current.setSearch("btc"));
    expect(result.current.isSearchActive).toBe(true);

    act(() => result.current.clearSearch());
    expect(result.current.isSearchActive).toBe(false);
  });
});
