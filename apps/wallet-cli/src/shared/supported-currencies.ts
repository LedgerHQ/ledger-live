import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  isCurrencySupported,
  listSupportedCurrencies,
} from "@ledgerhq/live-common/coin-modules/registry";

// Support is declared once, by the `supportedCoins` of the coin-module loaders registered in
// live-common-setup.ts. Registration must have run before these are called.

export function listWalletCliSupportedCurrencyIds(): string[] {
  return listSupportedCurrencies().map(currency => currency.id);
}

/** True for a supported mainnet or one of its testnets (e.g. bitcoin_testnet, solana_devnet). */
export function isWalletCliSupportedCurrency(currency: CryptoCurrency): boolean {
  return isCurrencySupported(
    currency.isTestnetFor ? getCryptoCurrencyById(currency.isTestnetFor) : currency,
  );
}
