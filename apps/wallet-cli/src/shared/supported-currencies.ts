import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { walletCliLoaders } from "../coin-module-loaders";

const supportedIds: ReadonlySet<string> = new Set(
  walletCliLoaders.flatMap(loader => loader.supportedCoins),
);

export function listWalletCliSupportedCurrencyIds(): string[] {
  return [...supportedIds];
}

/** True for a supported mainnet or one of its testnets (e.g. bitcoin_testnet, solana_devnet). */
export function isWalletCliSupportedCurrency(currency: CryptoCurrency): boolean {
  return supportedIds.has(currency.isTestnetFor ?? currency.id);
}
