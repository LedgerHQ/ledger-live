import { renderHook } from "tests/testSetup";
import { useAssetSelection } from "../useAssetSelection";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { act } from "react-dom/test-utils";

describe("useAssetSelection", () => {
  const mockCurrencies = [
    { id: "btc", name: "Bitcoin" },
    { id: "eth", name: "Ethereum" },
  ] as CryptoOrTokenCurrency[];
  const mockSorted = [
    { id: "eth", name: "Ethereum" },
    { id: "btc", name: "Bitcoin" },
    { id: "ada", name: "Cardano" },
  ] as CryptoOrTokenCurrency[];

  it("returns filtered currencies by default", () => {
    const { result } = renderHook(() => useAssetSelection(mockCurrencies, mockSorted));
    expect(result.current.assetsToDisplay).toEqual([
      { id: "eth", name: "Ethereum" },
      { id: "btc", name: "Bitcoin" },
    ]);
    expect(result.current.filteredSortedCryptoCurrencies).toEqual([
      { id: "eth", name: "Ethereum" },
      { id: "btc", name: "Bitcoin" },
    ]);
    expect(result.current.currenciesIdsArray).toEqual(["btc", "eth"]);
  });

  it("allows overriding assetsToDisplay", () => {
    const { result } = renderHook(() => useAssetSelection(mockCurrencies, mockSorted));
    act(() => {
      result.current.setAssetsToDisplay([{ id: "ada", name: "Cardano" } as CryptoOrTokenCurrency]);
    });
    expect(result.current.assetsToDisplay).toEqual([{ id: "ada", name: "Cardano" }]);
  });

  it("returns all the assets in assetsToDisplay if no matching currencies", () => {
    const { result } = renderHook(() => useAssetSelection([], mockSorted));
    expect(result.current.assetsToDisplay).toEqual(mockSorted);
    expect(result.current.filteredSortedCryptoCurrencies).toEqual(mockSorted);
    expect(result.current.currenciesIdsArray).toEqual([]);
  });
});
