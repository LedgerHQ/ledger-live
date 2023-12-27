import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { inferCryptoCurrencyIcon } from "./cryptoIcons";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";

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
    expect(
      inferCryptoCurrencyIcon(registryMock, getTokenById("ethereum/erc20/usd_tether__erc20_")),
    ).toBe(4);
  });
});
