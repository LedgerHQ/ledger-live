import { renderHook } from "tests/testSetup";
import { useAssetSelection } from "../useAssetSelection";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("useAssetSelection", () => {
  const mockCurrencyIds = ["ada", "btc", "eth"];
  const mockSorted = [
    { id: "eth", name: "Ethereum", type: "CryptoCurrency" },
    { id: "btc", name: "Bitcoin", type: "CryptoCurrency" },
    { id: "ada", name: "Cardano", type: "CryptoCurrency" },
  ] as CryptoOrTokenCurrency[];

  it("returns filtered currencies by default", () => {
    const { result } = renderHook(() => useAssetSelection(mockCurrencyIds, mockSorted));
    expect(result.current.assetsToDisplay).toEqual(mockSorted);
    expect(result.current.currencyIdsSet).toEqual(new Set(["ada", "btc", "eth"]));
  });

  it("returns all the assets in assetsToDisplay if no matching currencies", () => {
    const { result } = renderHook(() => useAssetSelection([], mockSorted));
    expect(result.current.assetsToDisplay).toEqual(mockSorted);
    expect(result.current.currencyIdsSet).toEqual(new Set());
  });
});
