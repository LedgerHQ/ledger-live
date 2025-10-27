import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens as addTokensLegacy } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { inferCryptoCurrencyIcon } from "./cryptoIcons";
import { getCryptoAssetsStore } from "../bridge/crypto-assets/index";

beforeAll(() => {
  initializeLegacyTokens(addTokensLegacy);
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
