import { renderHook, act } from "@tests/test-renderer";
import { useAssets } from "../useAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

const mockCurrencies: CryptoOrTokenCurrency[] = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC" } as CryptoOrTokenCurrency,
  { id: "ethereum", name: "Ethereum", ticker: "ETH" } as CryptoOrTokenCurrency,
];

const mockSortedCryptoCurrencies: CryptoOrTokenCurrency[] = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC" } as CryptoOrTokenCurrency,
  { id: "ethereum", name: "Ethereum", ticker: "ETH" } as CryptoOrTokenCurrency,
  { id: "litecoin", name: "Litecoin", ticker: "LTC" } as CryptoOrTokenCurrency,
];

describe("useAssets", () => {
  it("returns filtered sorted crypto currencies by default", () => {
    const { result } = renderHook(() => useAssets(mockCurrencies, mockSortedCryptoCurrencies));
    expect(result.current.availableAssets).toEqual([
      mockSortedCryptoCurrencies[0],
      mockSortedCryptoCurrencies[1],
    ]);
  });

  it("returns all sorted crypto currencies if currencies is empty", () => {
    const { result } = renderHook(() => useAssets([], mockSortedCryptoCurrencies));
    expect(result.current.availableAssets).toEqual(mockSortedCryptoCurrencies);
  });

  it("allows overriding assetsToDisplay", () => {
    const { result } = renderHook(() => useAssets(mockCurrencies, mockSortedCryptoCurrencies));
    act(() => {
      result.current.setAvailableAssets([mockSortedCryptoCurrencies[2]]);
    });
    expect(result.current.availableAssets).toEqual([mockSortedCryptoCurrencies[2]]);
  });
});
