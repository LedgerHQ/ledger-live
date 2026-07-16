import { renderHook, withFlagOverrides } from "tests/testSetup";
import { setEnv } from "@ledgerhq/live-env";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { useAssetSearchResultsViewModel } from "../useAssetSearchResultsViewModel";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData");
jest.mock("@ledgerhq/live-common/dada-client/utils/currencySelection");
jest.mock("@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate", () => ({
  useUsdToFiatRate: () => ({ rate: 1, status: "ready" }),
}));

const mockedAssets = jest.mocked(useAssetsData);
const mockedSelectCurrency = jest.mocked(selectCurrencyForMetaId);

// Single-network search payload (the mapper falls back to the asset id when no currency resolves).
const buildSearchData = (network: string) =>
  buildAssetsData({
    data: {
      currenciesOrder: { metaCurrencyIds: ["amdx"], key: "marketCap", order: "desc" },
      cryptoAssets: {
        amdx: {
          id: "amdx",
          name: "AMD xStock",
          ticker: "AMDX",
          assetsIds: { [network]: `${network}/erc20/amd` },
        },
      },
      markets: {},
    },
  } as never);

const buildAssetsData = (
  overrides: Partial<ReturnType<typeof useAssetsData>> = {},
): ReturnType<typeof useAssetsData> =>
  ({
    data: undefined,
    isLoading: false,
    isFetchingNextPage: false,
    error: undefined,
    errorInfo: undefined,
    loadNext: undefined,
    isSuccess: true,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  }) as ReturnType<typeof useAssetsData>;

describe("useAssetSearchResultsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setEnv("MANAGER_DEV_MODE", false);
    mockedAssets.mockReturnValue(buildAssetsData());
    mockedSelectCurrency.mockReturnValue(undefined);
  });

  afterEach(() => {
    setEnv("MANAGER_DEV_MODE", false);
  });

  it("excludes testnets and uses the prod environment by default", () => {
    renderHook(() => useAssetSearchResultsViewModel({ search: "btc" }));

    expect(mockedAssets).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "btc", includeTestNetworks: false, isStaging: false }),
    );
  });

  it("includes testnets in the query only in developer mode", () => {
    setEnv("MANAGER_DEV_MODE", true);

    renderHook(() => useAssetSearchResultsViewModel({ search: "btc" }));

    expect(mockedAssets).toHaveBeenLastCalledWith(
      expect.objectContaining({ includeTestNetworks: true }),
    );
  });

  it("derives isStaging from the lldModularDrawer backend environment", () => {
    renderHook(() => useAssetSearchResultsViewModel({ search: "btc" }), {
      initialState: withFlagOverrides({
        lldModularDrawer: { enabled: true, params: { backendEnvironment: "STAGING" } },
      }),
    });

    expect(mockedAssets).toHaveBeenLastCalledWith(expect.objectContaining({ isStaging: true }));
  });

  it("hides a result whose only network currency flag is off", () => {
    mockedAssets.mockReturnValue(buildSearchData("robinhood_testnet"));

    const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "amd" }));

    expect(result.current.data).toHaveLength(0);
  });

  it("shows the result when its network currency flag is on", () => {
    mockedAssets.mockReturnValue(buildSearchData("robinhood_testnet"));

    const { result } = renderHook(() => useAssetSearchResultsViewModel({ search: "amd" }), {
      initialState: withFlagOverrides({ currencyRobinhoodTestnet: { enabled: true } }),
    });

    expect(result.current.data).toHaveLength(1);
  });
});
