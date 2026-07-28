import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getEnv } from "@ledgerhq/live-env";
import type { WalletBtcCurrency } from "@ledgerhq/wallet-btc/crypto/types";

/**
 * Resolve a wallet-btc currency descriptor from a Ledger CryptoCurrency.
 *
 * wallet-btc is dependency-inverted: it no longer reads @ledgerhq/cryptoassets or
 * @ledgerhq/live-env. coin-bitcoin (which legitimately depends on both) resolves the
 * explorer id and endpoint here and injects them into wallet-btc.
 */
export const toWalletBtcCurrency = (currency: CryptoCurrency): WalletBtcCurrency => {
  if (currency.id === "bitcoin_regtest") {
    return {
      id: currency.id,
      explorerId: "btc_regtest",
      explorerEndpoint: getEnv("EXPLORER_REGTEST"),
    };
  }
  return {
    id: currency.id,
    explorerId: currency.explorerId ?? currency.id,
    explorerEndpoint: getEnv("EXPLORER"),
  };
};

/** Same as {@link toWalletBtcCurrency} but from a currency id (e.g. when rehydrating a serialized account). */
export const walletBtcCurrencyById = (currencyId: string): WalletBtcCurrency =>
  toWalletBtcCurrency(getCryptoCurrencyById(currencyId));
