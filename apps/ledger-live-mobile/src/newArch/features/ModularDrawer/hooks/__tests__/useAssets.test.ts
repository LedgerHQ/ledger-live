import { renderHook, act } from "@tests/test-renderer";
import { useAssets } from "../useAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  mockArbitrumCryptoCurrency,
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "../../__mocks__/currencies.mock";

const mockCurrencies: CryptoOrTokenCurrency[] = [mockBtcCryptoCurrency, mockEthCryptoCurrency];

const mockSortedCryptoCurrencies: CryptoOrTokenCurrency[] = [
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
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
