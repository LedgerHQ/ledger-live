import { renderHook } from "tests/testSetup";
import { useAssetSelection } from "../useAssetSelection";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { act } from "react-dom/test-utils";

describe("useAssetSelection", () => {
  const mockCurrencyIds = ["btc", "eth"];
  const mockSorted = [
    { id: "eth", name: "Ethereum" },
    { id: "btc", name: "Bitcoin" },
    { id: "ada", name: "Cardano" },
  ] as CryptoOrTokenCurrency[];

  it("returns filtered currencies by default", () => {
    const { result } = renderHook(() => useAssetSelection(mockCurrencyIds, mockSorted));
    expect(result.current.assetsToDisplay).toEqual([
      { id: "eth", name: "Ethereum" },
      { id: "btc", name: "Bitcoin" },
    ]);
    expect(result.current.currencyIdsSet).toEqual(new Set(["btc", "eth"]));
  });

  it("allows overriding assetsToDisplay", () => {
    const { result } = renderHook(() => useAssetSelection(mockCurrencyIds, mockSorted));
    act(() => {
      result.current.setAssetsToDisplay([{ id: "ada", name: "Cardano" } as CryptoOrTokenCurrency]);
    });
    expect(result.current.assetsToDisplay).toEqual([{ id: "ada", name: "Cardano" }]);
  });

  it("returns all the assets in assetsToDisplay if no matching currencies", () => {
    const { result } = renderHook(() => useAssetSelection([], mockSorted));
    expect(result.current.assetsToDisplay).toEqual(mockSorted);
    expect(result.current.currencyIdsSet).toEqual(new Set());
  });
});
