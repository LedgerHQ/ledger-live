import { haveOneCommonAsset } from "../haveOneCommonAsset";
import { AssetData } from "../type";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";

const MOCK_ASSETS_SORTED: AssetData[] = [
  {
    asset: {
      id: "ethereum",
      ticker: "ETH",
      name: "Ethereum",
      assetsIds: {
        ethereum: "ethereum",
        arbitrum: "arbitrum",
      },
      metaCurrencyId: "urn:crypto:meta-currency:ethereum",
    },
    networks: [getCryptoCurrencyById("ethereum"), getCryptoCurrencyById("arbitrum")],
  },
  {
    asset: {
      id: "bitcoin",
      ticker: "BTC",
      name: "Bitcoin",
      assetsIds: {
        bitcoin: "bitcoin",
      },
      metaCurrencyId: "bitcoin",
    },
    networks: [getCryptoCurrencyById("bitcoin")],
  },
];

describe("haveOneCommonAsset", () => {
  it("should return false for an empty array", () => {
    expect(haveOneCommonAsset([], [])).toBe(false);
  });

  it("should return true for a single currency with one provider", () => {
    expect(haveOneCommonAsset(["bitcoin"], MOCK_ASSETS_SORTED)).toBe(true);
  });

  it("should return false for multiple currencies with different providers", () => {
    expect(haveOneCommonAsset(["bitcoin", "ethereum"], MOCK_ASSETS_SORTED)).toBe(false);
  });

  it("should return true for multiple currencies with the same provider", () => {
    expect(haveOneCommonAsset(["ethereum", "arbitrum"], MOCK_ASSETS_SORTED)).toBe(true);
  });
});
