import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { inferCryptoCurrencyIcon } from "./cryptoIcons";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";

beforeAll(() => {
  initializeLegacyTokens(addTokens);
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

  test("USDT is inferred properly", () => {
    const usdt = findTokenById("ethereum/erc20/usd_tether__erc20_");
    if (!usdt) throw new Error("USDT token not found");
    expect(inferCryptoCurrencyIcon(registryMock, usdt)).toBe(4);
  });
});
