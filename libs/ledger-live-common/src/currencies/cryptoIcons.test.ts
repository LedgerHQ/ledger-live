import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setupMockCryptoAssetsStore } from "../test-helpers/cryptoAssetsStore";
import { inferCryptoCurrencyIcon } from "./cryptoIcons";
import { getCryptoAssetsStore } from "../bridge/crypto-assets/index";

beforeAll(() => {
  // Setup mock store for unit tests
  setupMockCryptoAssetsStore({
    findTokenById: async (id: string) => {
      // Return a mock token for the test
      if (id === "ethereum/erc20/usd_tether__erc20_") {
        return {
          type: "TokenCurrency",
          id: "ethereum/erc20/usd_tether__erc20_",
          contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
          parentCurrency: getCryptoCurrencyById("ethereum"),
          tokenType: "erc20",
          name: "Tether USD",
          ticker: "USDT",
          delisted: false,
          disableCountervalue: false,
          units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
        } as any;
      }
      return undefined;
    },
  });
});

describe("inferCryptoCurrencyIcon", () => {
  const registryMock = {
    BTC: 1,
    ETH: 2,
    CURRENCY_ARBITRUM: 3,
    USDT: 4,
  };

  test("Bitcoin Testnet is inferred properly", () => {
    expect(inferCryptoCurrencyIcon(registryMock, getCryptoCurrencyById("bitcoin_testnet"))).toBe(1);
  });

  test("Ethereum is inferred properly", () => {
    expect(inferCryptoCurrencyIcon(registryMock, getCryptoCurrencyById("ethereum"))).toBe(2);
  });

  test("Arbitrum is inferred properly", () => {
    expect(inferCryptoCurrencyIcon(registryMock, getCryptoCurrencyById("arbitrum"))).toBe(3);
  });

  test("USDT is inferred properly", async () => {
    const token = await getCryptoAssetsStore().findTokenById("ethereum/erc20/usd_tether__erc20_");
    expect(inferCryptoCurrencyIcon(registryMock, token!)).toBe(4);
  });
});
