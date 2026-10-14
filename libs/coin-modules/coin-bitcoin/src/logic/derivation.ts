import {
  asDerivationMode,
  isNativeSegwitDerivationMode,
  isSegwitDerivationMode,
  isTaprootDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { cryptoFor } from "./currency";
import type { BitcoinDerivationMode } from "./types";

const BITCOIN_DERIVATION_MODES: ReadonlySet<string> = new Set<BitcoinDerivationMode>([
  "Legacy",
  "SegWit",
  "Native SegWit",
  "Taproot",
]);

const isBitcoinDerivationMode = (mode: string): mode is BitcoinDerivationMode =>
  BITCOIN_DERIVATION_MODES.has(mode);

/** wallet-btc's derivation mode, from its own name or from a Ledger Wallet one ("native_segwit", ...). */
export function toBitcoinDerivationMode(mode: string): BitcoinDerivationMode {
  if (isBitcoinDerivationMode(mode)) return mode;
  const walletMode = asDerivationMode(mode);
  if (isTaprootDerivationMode(walletMode)) return "Taproot";
  if (isNativeSegwitDerivationMode(walletMode)) return "Native SegWit";
  if (isSegwitDerivationMode(walletMode)) return "SegWit";
  return "Legacy";
}

export type DeriveAddressRequest = {
  /** Extended public key of the account. */
  key: string;
  derivationMode: string;
  chain: number;
  index: number;
};

/** The address of an account key on an HD chain, as the explorer knows it. */
export const deriveAddress = (
  currencyId: string,
  { key, derivationMode, chain, index }: DeriveAddressRequest,
): Promise<string> =>
  cryptoFor(currencyId).getAddress(toBitcoinDerivationMode(derivationMode), key, chain, index);
