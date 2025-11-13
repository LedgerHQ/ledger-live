import { groupCurrenciesByProvider } from "../groupCurrenciesByProvider";
import { AssetData } from "../type";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  mockBaseCryptoCurrency,
} from "../../__mocks__/currencies.mock";

describe("groupCurrenciesByProvider", () => {
  it("should return an empty map when given an empty array", () => {
    const result = groupCurrenciesByProvider([]);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it("should skip assets with empty networks array", () => {
    const assetData: AssetData[] = [
      {
        asset: {
          id: "bitcoin",
          ticker: "BTC",
          name: "Bitcoin",
          assetsIds: {},
        },
        networks: [],
      },
    ];

    const result = groupCurrenciesByProvider(assetData);
    expect(result.size).toBe(0);
  });

  it("should group a single asset with matching providerId as mainCurrency", () => {
    const assetData: AssetData[] = [
      {
        asset: {
          id: "ethereum",
          ticker: "ETH",
          name: "Ethereum",
          assetsIds: {},
        },
        networks: [mockBaseCryptoCurrency, mockEthCryptoCurrency],
      },
    ];

    const result = groupCurrenciesByProvider(assetData);
    expect(result.size).toBe(1);
    expect(result.has("ethereum")).toBe(true);

    const grouped = result.get("ethereum");
    expect(grouped?.mainCurrency).toEqual(mockEthCryptoCurrency);
    expect(grouped?.currencies).toEqual([mockBaseCryptoCurrency, mockEthCryptoCurrency]);
  });

  it("should group multiple assets correctly", () => {
    const assetData: AssetData[] = [
      {
        asset: {
          id: "bitcoin",
          ticker: "BTC",
          name: "Bitcoin",
          assetsIds: {},
        },
        networks: [mockBtcCryptoCurrency],
      },
      {
        asset: {
          id: "ethereum",
          ticker: "ETH",
          name: "Ethereum",
          assetsIds: {},
        },
        networks: [mockEthCryptoCurrency, mockBaseCryptoCurrency],
      },
    ];

    const result = groupCurrenciesByProvider(assetData);
    expect(result.size).toBe(2);
    expect(result.has("bitcoin")).toBe(true);
    expect(result.has("ethereum")).toBe(true);

    const btcGrouped = result.get("bitcoin");
    expect(btcGrouped?.mainCurrency).toEqual(mockBtcCryptoCurrency);

    const ethGrouped = result.get("ethereum");
    expect(ethGrouped?.mainCurrency).toEqual(mockEthCryptoCurrency);
  });
});
