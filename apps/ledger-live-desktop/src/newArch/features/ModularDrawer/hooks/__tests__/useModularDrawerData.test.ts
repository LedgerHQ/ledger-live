import { useModularDrawerData } from "../useModularDrawerData";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { renderHook, waitFor } from "tests/testSetup";
import {
  expectedAssetsSorted,
  expectedCurrenciesByProvider,
} from "../../__mocks__/useModularDrawerData.mock";

describe("useModularDrawerData", () => {
  it("should return the correct data structure", async () => {
    const { result } = renderHook(() =>
      useModularDrawerData({
        searchedValue: undefined,
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Pending);

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.loadingStatus).toBe(LoadingStatus.Success);
  });

  it("should process assets data correctly", async () => {
    const { result } = renderHook(() =>
      useModularDrawerData({
        searchedValue: undefined,
      }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    const { assetsSorted, currenciesByProvider, sortedCryptoCurrencies } = result.current;

    expect(assetsSorted).toBeDefined();
    expect(assetsSorted).toHaveLength(10);
    const assets = assetsSorted?.map(assetData => assetData.asset);
    expect(assets).toEqual(expectedAssetsSorted);

    expect(currenciesByProvider).toBeDefined();
    expect(currenciesByProvider).toHaveLength(10);
    for (let i = 0; i < currenciesByProvider.length; i++) {
      const currencyByProvider = currenciesByProvider[i];
      const expectedCurrencyByProvider = expectedCurrenciesByProvider[i];
      expect(currencyByProvider.providerId).toBe(expectedCurrencyByProvider.providerId);
      expect(currencyByProvider.currenciesByNetwork).toHaveLength(
        expectedCurrencyByProvider.nbCurrenciesByNetwork,
      );
    }

    expect(sortedCryptoCurrencies).toBeDefined();
    expect(Array.isArray(sortedCryptoCurrencies)).toBe(true);
    expect(sortedCryptoCurrencies[0].id).toBe("bitcoin");
  });
});
