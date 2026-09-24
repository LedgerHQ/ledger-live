import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { WalletBtcCurrency } from "@ledgerhq/wallet-btc/crypto/types";

/**
 * Resolve a wallet-btc currency descriptor from a Ledger CryptoCurrency.
 *
 * wallet-btc is dependency-inverted: it reads neither the currency registry nor
 * any configuration. coin-zcash resolves the explorer id here and injects it with
 * the explorer endpoint from the coin config.
 */
export const toWalletBtcCurrency = (
  currency: CryptoCurrency,
  explorerEndpoint: string,
): WalletBtcCurrency => ({
  id: currency.id,
  explorerId: currency.explorerId ?? currency.id,
  explorerEndpoint,
});

/** Same as {@link toWalletBtcCurrency} but from a currency id (e.g. when rehydrating a serialized account). */
export const walletBtcCurrencyById = (
  currencyId: string,
  explorerEndpoint: string,
): WalletBtcCurrency => toWalletBtcCurrency(getCryptoCurrencyById(currencyId), explorerEndpoint);
