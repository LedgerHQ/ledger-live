import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { WalletBtcCurrency } from "@ledgerhq/wallet-btc/crypto/types";
import { getCoinConfig } from "./config";

/**
 * Resolve a wallet-btc currency descriptor from a Ledger CryptoCurrency.
 *
 * wallet-btc is dependency-inverted: it no longer reads the currency registry or
 * any configuration. coin-zcash resolves the explorer id (from the registry) and
 * the endpoint (from the currency's coin config) here and injects them into wallet-btc.
 */
export const toWalletBtcCurrency = (currency: CryptoCurrency): WalletBtcCurrency => ({
  id: currency.id,
  explorerId: currency.explorerId ?? currency.id,
  explorerEndpoint: getCoinConfig(currency.id).info.infra.EXPLORER,
});

/** Same as {@link toWalletBtcCurrency} but from a currency id (e.g. when rehydrating a serialized account). */
export const walletBtcCurrencyById = (currencyId: string): WalletBtcCurrency =>
  toWalletBtcCurrency(getCryptoCurrencyById(currencyId));
