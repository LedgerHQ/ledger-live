import { renderHook, waitFor } from "@tests/test-renderer";
import { useAssets } from "../useAssets";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { expectedAssetsSorted as expectedAssetsSortedFromMock } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData", () => {
  const actual = jest.requireActual<
    typeof import("@ledgerhq/live-common/dada-client/hooks/useAssetsData")
  >("@ledgerhq/live-common/dada-client/hooks/useAssetsData");

  return {
    ...actual,
    useAssetsData: jest.fn(actual.useAssetsData),
  };
});

const mockedUseAssetsData = jest.mocked(useAssetsData);
const actualUseAssetsData = jest.requireActual<
  typeof import("@ledgerhq/live-common/dada-client/hooks/useAssetsData")
>("@ledgerhq/live-common/dada-client/hooks/useAssetsData").useAssetsData;

jest.mock("@ledgerhq/live-common/coin-modules/registry", () => ({
  ...jest.requireActual("@ledgerhq/live-common/coin-modules/registry"),
  isCurrencySupported: jest.fn(() => true),
}));

describe("useAssets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockedUseAssetsData.mockImplementation(actualUseAssetsData);
  });

  it("transforms data into assetsSorted and sortedCryptoCurrencies", async () => {
    const { result } = renderHook(() => useAssets({}));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Success);

    const assets = result.current.assetsSorted?.map(a => a.asset);
    const expectedAssetsWithoutMetaCurrencyId = expectedAssetsSortedFromMock.map(asset => {
      const { metaCurrencyId: _metaCurrencyId, ...assetWithoutMetaCurrencyId } = asset;
      return assetWithoutMetaCurrencyId;
    });

    expect(assets).toEqual(expectedAssetsWithoutMetaCurrencyId);

    expect(result.current.sortedCryptoCurrencies.length).toBeGreaterThan(0);
    expect(result.current.sortedCryptoCurrencies[0].id).toBe("bitcoin");
  });

  it("keeps native assets and tokens available on allowed parent networks", async () => {
    const { result } = renderHook(() => useAssets({ networkIds: ["ethereum"] }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.sortedCryptoCurrencies.map(currency => currency.id)).toEqual(
      expect.arrayContaining([
        "ethereum",
        "ethereum/erc20/usd_tether__erc20_",
        "ethereum/erc20/usd__coin",
      ]),
    );
    expect(
      result.current.assetsSorted?.every(asset =>
        asset.networks.every(currency =>
          currency.type === "TokenCurrency"
            ? currency.parentCurrencyId === "ethereum"
            : currency.id === "ethereum",
        ),
      ),
    ).toBe(true);
  });

  it("forwards network ids to DADA", () => {
    mockedUseAssetsData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetchingNextPage: false,
      isSuccess: true,
      isError: false,
      error: undefined,
      errorInfo: {
        hasError: false,
        isNetworkError: false,
        isApiError: false,
        apiStatus: undefined,
      },
      loadNext: undefined,
      refetch: jest.fn(),
    });

    renderHook(() => useAssets({ networkIds: ["ethereum", "tron"] }));

    expect(mockedUseAssetsData).toHaveBeenCalledWith(
      expect.objectContaining({ networkIds: ["ethereum", "tron"] }),
    );
  });
});
