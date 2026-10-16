import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency, ICrypto } from "@ledgerhq/wallet-btc/crypto/types";

/** The address chains of a BIP44 account. */
export const RECEIVE_CHAIN = 0;
export const CHANGE_CHAIN = 1;

const cryptos = new Map<string, ICrypto>();

/** Key derivation of a currency, for the Ledger Wallet flows that need public keys (wallet API, PSBT). */
export function cryptoFor(currencyId: string): ICrypto {
  let crypto = cryptos.get(currencyId);
  if (!crypto) {
    crypto = cryptoFactory(currencyId as Currency);
    cryptos.set(currencyId, crypto);
  }
  return crypto;
}
