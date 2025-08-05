import { renderHook, act } from "@tests/test-renderer";
import { useAssets } from "../useAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  mockArbitrumCryptoCurrency,
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockCurrenciesByProvider,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

const mockCurrencies: CryptoOrTokenCurrency[] = [mockBtcCryptoCurrency, mockEthCryptoCurrency];

const mockSortedCryptoCurrencies: CryptoOrTokenCurrency[] = [
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockArbitrumCryptoCurrency,
];

describe("useAssets", () => {
  it("returns filtered sorted crypto currencies by default", () => {
    const { result } = renderHook(() =>
      useAssets(mockCurrencies, mockCurrenciesByProvider, mockSortedCryptoCurrencies),
    );
    expect(result.current.availableAssets).toEqual([mockEthCryptoCurrency]);
  });

  it("returns all sorted crypto currencies if currencies is empty", () => {
    const { result } = renderHook(() =>
      useAssets([], mockCurrenciesByProvider, mockSortedCryptoCurrencies),
    );
    expect(result.current.availableAssets).toEqual(mockSortedCryptoCurrencies);
  });

  it("allows overriding assetsToDisplay", () => {
    const { result } = renderHook(() =>
      useAssets(mockCurrencies, mockCurrenciesByProvider, mockSortedCryptoCurrencies),
    );
    act(() => {
      result.current.setAvailableAssets([mockSortedCryptoCurrencies[2]]);
    });
    expect(result.current.availableAssets).toEqual([mockSortedCryptoCurrencies[2]]);
  });
});
