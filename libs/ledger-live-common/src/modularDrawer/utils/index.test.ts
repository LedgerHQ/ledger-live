import { isCorrespondingCurrency } from "./index";

import { createFixtureCryptoCurrency } from "../../mock/fixtures/cryptoCurrencies";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

describe("isCorrespondingCurrency", () => {
  const evmCurrency = createFixtureCryptoCurrency("evm");
  const usdcToken: CryptoOrTokenCurrency = {
    type: "TokenCurrency",
    id: "ethereum/erc20/usdc",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    parentCurrency: evmCurrency,
    tokenType: "erc20",
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  };
  const evmCrypto: CryptoOrTokenCurrency = evmCurrency;

  it("returns true for a token whose parentCurrency.id matches the reference crypto", () => {
    expect(isCorrespondingCurrency(usdcToken, evmCurrency)).toBe(true);
  });

  it("returns true for a token whose id matches the reference crypto", () => {
    expect(isCorrespondingCurrency(usdcToken, usdcToken)).toBe(true);
  });

  it("returns true for a crypto whose id matches the reference crypto", () => {
    expect(isCorrespondingCurrency(evmCrypto, evmCurrency)).toBe(true);
  });

  it("returns false for a token whose parentCurrency is different", () => {
    const bitcoinCurrency = cryptocurrenciesById["bitcoin"];
    const tokenWithOtherParent = { ...usdcToken, parentCurrency: bitcoinCurrency };
    expect(isCorrespondingCurrency(tokenWithOtherParent, evmCurrency)).toBe(false);
  });

  it("returns false for a crypto whose id is different", () => {
    const bitcoinCurrency = cryptocurrenciesById["bitcoin"];
    expect(isCorrespondingCurrency(bitcoinCurrency, evmCurrency)).toBe(false);
  });
});
