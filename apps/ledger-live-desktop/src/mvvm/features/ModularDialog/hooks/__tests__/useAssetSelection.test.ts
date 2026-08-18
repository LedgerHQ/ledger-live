import { renderHook } from "tests/testSetup";
import { useAssetSelection } from "../useAssetSelection";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { usdcToken } from "../../../__mocks__/useSelectAssetFlow.mock";

// Mock useAcceptedCurrency to return a function that checks if currency is in supported list
jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: jest.fn(() => {
    const supported = new Set([
      "cardano",
      "bitcoin",
      "ethereum",
      "neo",
      "ethereum/erc20/usd__coin",
    ]);
    return (currency: CryptoOrTokenCurrency) => supported.has(currency.id);
  }),
}));

describe("useAssetSelection", () => {
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

  it("returns all currencies when all are supported", () => {
    const mockSorted = [mockEthereum, mockBitcoin, mockCardano, mockNeo];
    const { result } = renderHook(() => useAssetSelection(mockSorted));
    // All currencies are supported
    expect(result.current.assetsToDisplay).toEqual([
      mockEthereum,
      mockBitcoin,
      mockCardano,
      mockNeo,
    ]);
  });

  it("returns all supported assets even if currencyIds is empty", () => {
    const mockSorted = [mockEthereum, mockBitcoin, mockCardano];
    const { result } = renderHook(() => useAssetSelection(mockSorted));
    expect(result.current.assetsToDisplay).toEqual([mockEthereum, mockBitcoin, mockCardano]);
  });

  it("should derive disabled assets from the selectable network IDs", () => {
    const assetsSorted: AssetData[] = [
      {
        asset: {
          id: mockEthereum.id,
          ticker: "ETH",
          name: mockEthereum.name,
          assetsIds: { ethereum: "ethereum" },
        },
        networks: [mockEthereum, usdcToken],
      },
      {
        asset: {
          id: mockBitcoin.id,
          ticker: "BTC",
          name: mockBitcoin.name,
          assetsIds: { bitcoin: "bitcoin" },
        },
        networks: [mockBitcoin],
      },
    ];

    const { result: unrestricted } = renderHook(() =>
      useAssetSelection([mockEthereum, mockBitcoin], assetsSorted),
    );
    expect(unrestricted.current.disabledAssetIds).toEqual(new Set());

    const { result: evmOnly } = renderHook(() =>
      useAssetSelection([mockEthereum, mockBitcoin], assetsSorted, [mockEthereum.id]),
    );
    expect(evmOnly.current.disabledAssetIds).toEqual(new Set([mockBitcoin.id]));

    const { result: noneSelectable } = renderHook(() =>
      useAssetSelection([mockEthereum, mockBitcoin], assetsSorted, []),
    );
    expect(noneSelectable.current.disabledAssetIds).toEqual(
      new Set([mockEthereum.id, mockBitcoin.id]),
    );
  });
});
