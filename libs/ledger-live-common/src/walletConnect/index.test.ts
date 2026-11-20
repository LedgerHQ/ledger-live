import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  isWalletConnectSupported,
  mainnetCurrenciesSupportedOnWalletConnect,
  testnetAndDevnetCurrenciesSupportedOnWalletConnect,
} from "./index";

describe("isWalletConnectSupported (static fallback)", () => {
  it.each(mainnetCurrenciesSupportedOnWalletConnect)(
    "returns true for mainnet currency: %s",
    currencyId => {
      const currency = getCryptoCurrencyById(currencyId);
      expect(isWalletConnectSupported(currency)).toBe(true);
    },
  );

  it.each(testnetAndDevnetCurrenciesSupportedOnWalletConnect)(
    "returns true for testnet/devnet currency: %s",
    currencyId => {
      const currency = getCryptoCurrencyById(currencyId);
      expect(isWalletConnectSupported(currency)).toBe(true);
    },
  );

  it("supports bitcoin_signet as a testnet, not a mainnet", () => {
    expect(isWalletConnectSupported(getCryptoCurrencyById("bitcoin_signet"))).toBe(true);
    expect(testnetAndDevnetCurrenciesSupportedOnWalletConnect).toContain("bitcoin_signet");
    expect(mainnetCurrenciesSupportedOnWalletConnect).not.toContain("bitcoin_signet");
  });

  it("returns false for an unsupported currency", () => {
    const cardano = getCryptoCurrencyById("cardano");
    expect(isWalletConnectSupported(cardano)).toBe(false);
  });
});
