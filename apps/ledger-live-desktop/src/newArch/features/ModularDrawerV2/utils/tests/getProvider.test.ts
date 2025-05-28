import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { MOCK_CURRENCY_BY_PROVIDER_ID } from "./mockData";
import { getProvider } from "../getProvider";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";

const mockedCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  coinType: 60,
  name: "Ethereum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "ethereum",
  color: "#0ebdcd",
  symbol: "Ξ",
  family: "evm",
  blockAvgTime: 15,
  units: [
    {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
    {
      name: "Gwei",
      code: "Gwei",
      magnitude: 9,
    },
    {
      name: "Mwei",
      code: "Mwei",
      magnitude: 6,
    },
    {
      name: "Kwei",
      code: "Kwei",
      magnitude: 3,
    },
    {
      name: "wei",
      code: "wei",
      magnitude: 0,
    },
  ],
  ethereumLikeInfo: {
    chainId: 1,
  },
  explorerViews: [
    {
      tx: "https://etherscan.io/tx/$hash",
      address: "https://etherscan.io/address/$address",
      token: "https://etherscan.io/token/$contractAddress?a=$address",
    },
  ],
  keywords: ["eth", "ethereum"],
  explorerId: "eth",
} satisfies CryptoOrTokenCurrency;

describe("getProvider", () => {
  it("should return the provider for a currency with a single provider", () => {
    const result = getProvider(
      mockedCurrency,
      MOCK_CURRENCY_BY_PROVIDER_ID as CurrenciesByProviderId[],
    );
    expect(result).toBeDefined();
    expect(result?.providerId).toBe("ethereum");
  });

  it("should return the provider for a currency with multiple providers", () => {
    const result = getProvider(
      mockedCurrency,
      MOCK_CURRENCY_BY_PROVIDER_ID as CurrenciesByProviderId[],
    );
    expect(result).toBeDefined();
    expect(result?.providerId).toBe("ethereum");
  });

  it("should return undefined for a currency with no provider", () => {
    const result = getProvider(
      { ...mockedCurrency, id: "nonexistent" } as CryptoOrTokenCurrency,
      MOCK_CURRENCY_BY_PROVIDER_ID as CurrenciesByProviderId[],
    );
    expect(result).toBeUndefined();
  });
});
