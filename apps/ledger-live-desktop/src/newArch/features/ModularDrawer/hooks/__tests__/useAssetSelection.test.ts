import { renderHook } from "tests/testSetup";
import { useAssetSelection } from "../useAssetSelection";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setSupportedCurrencies } from "@ledgerhq/coin-framework/lib-es/currencies/support";

setSupportedCurrencies(["cardano", "bitcoin", "ethereum", "neo"]);

// Mock useAcceptedCurrency to return a function that checks if currency is in supported list
jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: jest.fn(() => {
    const supported = new Set(["cardano", "bitcoin", "ethereum", "neo"]);
    return (currency: CryptoOrTokenCurrency) => supported.has(currency.id);
  }),
}));

describe("useAssetSelection", () => {
  const mockCurrencyIds = ["cardano", "bitcoin", "ethereum"];
  const mockEthereum = {
    id: "ethereum",
    name: "Ethereum",
    type: "CryptoCurrency",
  } as CryptoOrTokenCurrency;
  const mockBitcoin = {
    id: "bitcoin",
    name: "Bitcoin",
    type: "CryptoCurrency",
  } as CryptoOrTokenCurrency;
  const mockCardano = {
    id: "cardano",
    name: "Cardano",
    type: "CryptoCurrency",
  } as CryptoOrTokenCurrency;
  const mockNeo = { id: "neo", name: "NEO", type: "CryptoCurrency" } as CryptoOrTokenCurrency;

  beforeEach(() => {
    // Ensure currencies are marked as supported before each test
    setSupportedCurrencies(["cardano", "bitcoin", "ethereum", "neo"]);
  });

  it("returns all currencies when all are supported", () => {
    const mockSorted = [mockEthereum, mockBitcoin, mockCardano, mockNeo];
    const { result } = renderHook(() => useAssetSelection(mockCurrencyIds, mockSorted));
    // All currencies are supported
    expect(result.current.assetsToDisplay).toEqual([
      mockEthereum,
      mockBitcoin,
      mockCardano,
      mockNeo,
    ]);
    expect(result.current.currencyIdsSet).toEqual(new Set(["cardano", "bitcoin", "ethereum"]));
  });

  it("returns all supported assets even if currencyIds is empty", () => {
    const mockSorted = [mockEthereum, mockBitcoin, mockCardano];
    const { result } = renderHook(() => useAssetSelection([], mockSorted));
    expect(result.current.assetsToDisplay).toEqual([mockEthereum, mockBitcoin, mockCardano]);
    expect(result.current.currencyIdsSet).toEqual(new Set());
  });
});
