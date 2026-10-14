import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { WalletBtcCurrency } from "@ledgerhq/wallet-btc/crypto/types";
import type { BitcoinCoinConfig } from "./config";

/** The part of the coin config wallet-btc needs to reach the explorer. */
export type ExplorerConfig = Pick<BitcoinCoinConfig, "explorer" | "explorerId">;

/**
 * Resolve a wallet-btc currency descriptor from a Ledger CryptoCurrency.
 *
 * wallet-btc is dependency-inverted: it reads neither the currency registry nor
 * any configuration. coin-bitcoin injects the explorer id, endpoint and batch size from the
 * coin config.
 */
export const toWalletBtcCurrency = (
  currency: CryptoCurrency,
  config: ExplorerConfig,
): WalletBtcCurrency => ({
  id: currency.id,
  explorerId: config.explorerId ?? currency.id,
  explorerEndpoint: config.explorer.url,
  ...(config.explorer.batchSize === undefined
    ? {}
    : { explorerBatchSize: config.explorer.batchSize }),
});

/** Same as {@link toWalletBtcCurrency} but from a currency id (e.g. when rehydrating a serialized account). */
export const walletBtcCurrencyById = (
  currencyId: string,
  config: ExplorerConfig,
): WalletBtcCurrency => toWalletBtcCurrency(getCryptoCurrencyById(currencyId), config);
