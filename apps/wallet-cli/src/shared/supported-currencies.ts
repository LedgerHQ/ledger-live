import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { walletCliLoaders } from "../coin-module-loaders";

export function listWalletCliSupportedCurrencyIds(): string[] {
  return walletCliLoaders.flatMap(loader => loader.supportedCoins);
}

/** True for a supported mainnet id only (e.g. "ethereum", not "ethereum_sepolia"). */
export function isWalletCliSupportedCurrencyId(id: string): boolean {
  return walletCliLoaders.some(loader => loader.supportedCoins.includes(id));
}

/** True for a supported mainnet or one of its testnets (e.g. bitcoin_testnet, solana_devnet). */
export function isWalletCliSupportedCurrency(currency: CryptoCurrency): boolean {
  return isWalletCliSupportedCurrencyId(currency.isTestnetFor ?? currency.id);
}
