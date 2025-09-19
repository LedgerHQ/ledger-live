import { haveOneCommonProvider } from "../haveOneCommonProvider";
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
    },
    networks: [getCryptoCurrencyById("bitcoin")],
  },
];

describe("haveOneCommonProvider", () => {
  it("should return false for an empty array", () => {
    expect(haveOneCommonProvider([], [])).toBe(false);
  });

  it("should return true for a single currency with one provider", () => {
    expect(haveOneCommonProvider(["bitcoin"], MOCK_ASSETS_SORTED)).toBe(true);
  });

  it("should return false for multiple currencies with different providers", () => {
    expect(haveOneCommonProvider(["bitcoin", "ethereum"], MOCK_ASSETS_SORTED)).toBe(false);
  });

  it("should return true for multiple currencies with the same provider", () => {
    expect(haveOneCommonProvider(["ethereum", "arbitrum"], MOCK_ASSETS_SORTED)).toBe(true);
  });
});
