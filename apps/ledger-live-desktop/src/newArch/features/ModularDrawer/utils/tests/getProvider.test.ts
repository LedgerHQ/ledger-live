import {
  arbitrumCurrency,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
} from "../../../__mocks__/useSelectAssetFlow.mock";
import { getProvider } from "../getProvider";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

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
    networks: [ethereumCurrency, arbitrumCurrency],
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
    networks: [bitcoinCurrency],
  },
];

describe("getProvider", () => {
  it("should return the provider for a currency with a single provider", () => {
    const result = getProvider(bitcoinCurrency, MOCK_ASSETS_SORTED);
    expect(result).toBeDefined();
    expect(result?.asset.id).toBe("bitcoin");
  });

  it("should return the provider for a currency with multiple providers", () => {
    const result = getProvider(ethereumCurrency, MOCK_ASSETS_SORTED);
    expect(result).toBeDefined();
    expect(result?.asset.id).toBe("ethereum");
  });

  it("should return undefined for a currency with no provider", () => {
    const result = getProvider(baseCurrency, MOCK_ASSETS_SORTED);
    expect(result).toBeUndefined();
  });
});
