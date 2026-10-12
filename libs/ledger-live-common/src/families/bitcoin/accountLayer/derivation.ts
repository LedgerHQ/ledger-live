import {
  isNativeSegwitDerivationMode,
  isSegwitDerivationMode,
  isTaprootDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { DerivationMode } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency, ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import type { BitcoinDerivationMode } from "@ledgerhq/coin-bitcoin/api";

/** The address chains of a BIP44 account. */
export const RECEIVE_CHAIN = 0;
export const CHANGE_CHAIN = 1;

/** Ledger Wallet derivation mode → wallet-btc's, which drives address encoding and sizes. */
export function toWalletDerivationMode(mode: DerivationMode): BitcoinDerivationMode {
  if (isTaprootDerivationMode(mode)) return "Taproot";
  if (isNativeSegwitDerivationMode(mode)) return "Native SegWit";
  if (isSegwitDerivationMode(mode)) return "SegWit";
  return "Legacy";
}

const cryptos = new Map<string, ICrypto>();

export function cryptoFor(currencyId: string): ICrypto {
  let crypto = cryptos.get(currencyId);
  if (!crypto) {
    crypto = cryptoFactory(currencyId as Currency);
    cryptos.set(currencyId, crypto);
  }
  return crypto;
}

/** "84'/0'" (or a full path, the CLI passes one) and an account index → "84'/0'/3'". */
export function accountPathFrom(derivationPath: string, index: number): string {
  const rootPath = derivationPath.split("/", 2).join("/");
  return `${rootPath}/${index}'`;
}

/** The account path of an account, from its fresh address path "84'/0'/3'/0/12". */
export const accountPathOf = (freshAddressPath: string): string =>
  freshAddressPath.split("/").slice(0, 3).join("/");

export const addressPath = (accountPath: string, chain: number, index: number): string =>
  `${accountPath}/${chain}/${index}`;

export type AddressDeriver = (chain: number, index: number) => Promise<string>;

/** Addresses of an extended public key (wallet-btc caches them). */
export function addressDeriver(
  currencyId: string,
  derivationMode: BitcoinDerivationMode,
  xpub: string,
): AddressDeriver {
  const crypto = cryptoFor(currencyId);
  return (chain, index) => crypto.getAddress(derivationMode, xpub, chain, index);
}
