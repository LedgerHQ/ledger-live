import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getEnv } from "@ledgerhq/live-env";
import type { WalletBtcCurrency } from "@ledgerhq/wallet-btc/crypto/types";
import type { BitcoinConfigInfo } from "./config";

/**
 * Resolve a wallet-btc currency descriptor from a Ledger CryptoCurrency.
 *
 * wallet-btc is dependency-inverted: it no longer reads the currency registry or
 * @ledgerhq/live-env. coin-bitcoin (which legitimately depends on both) resolves the
 * explorer id and endpoint here and injects them into wallet-btc.
 */
export const toWalletBtcCurrency = (
  currency: CryptoCurrency,
  config: Pick<BitcoinConfigInfo, "explorerId">,
): WalletBtcCurrency => {
  if (currency.id === "bitcoin_regtest") {
    return {
      id: currency.id,
      explorerId: "btc_regtest",
      explorerEndpoint: getEnv("EXPLORER_REGTEST"),
    };
  }
  return {
    id: currency.id,
    explorerId: config.explorerId ?? currency.id,
    explorerEndpoint: getEnv("EXPLORER"),
  };
};

/** Same as {@link toWalletBtcCurrency} but from a currency id (e.g. when rehydrating a serialized account). */
export const walletBtcCurrencyById = (
  currencyId: string,
  config: Pick<BitcoinConfigInfo, "explorerId">,
): WalletBtcCurrency => toWalletBtcCurrency(getCryptoCurrencyById(currencyId), config);
