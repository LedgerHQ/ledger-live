import { renderHook, waitFor } from "@tests/test-renderer";
import { useAssets } from "../useAssets";
import { expectedAssetsSorted as expectedAssetsSortedFromMock } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";

describe("useAssets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("transforms data into assetsSorted and sortedCryptoCurrencies", async () => {
    const { result } = renderHook(() => useAssets({}));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Success);

    // assetsSorted shape and order should match expected mock
    const assets = result.current.assetsSorted?.map(a => a.asset);

    expect(assets).toEqual(expectedAssetsSortedFromMock);

    expect(result.current.sortedCryptoCurrencies.length).toBeGreaterThan(0);
    expect(result.current.sortedCryptoCurrencies[0].id).toBe("bitcoin");
  });
});
