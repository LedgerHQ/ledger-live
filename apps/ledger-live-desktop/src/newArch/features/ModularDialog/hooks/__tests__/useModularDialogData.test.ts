import { useModularDialogData } from "../useModularDialogData";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { renderHook, waitFor } from "tests/testSetup";
import { expectedAssetsSorted } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";

describe("useModularDialogData", () => {
  it("should return the correct data structure", async () => {
    const { result } = renderHook(() => useModularDialogData({}));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Pending);

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Success);
  });

  it("should process assets data correctly", async () => {
    const { result } = renderHook(() => useModularDialogData({}));

    expect(result.current.isLoading).toBe(true);

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    const { assetsSorted, sortedCryptoCurrencies } = result.current;

    expect(assetsSorted).toBeDefined();
    expect(assetsSorted).toHaveLength(10);
    const assets = assetsSorted?.map(assetData => assetData.asset);
    expect(assets).toEqual(expectedAssetsSorted);

    expect(sortedCryptoCurrencies).toBeDefined();
    expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
    expect(sortedCryptoCurrencies[0].id).toBe("bitcoin");
  });
});
