import cashaddr from "cashaddrjs";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency, ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import { getNetworkParameters } from "./networks";
import type { BitcoinDerivationMode } from "./types";

const cryptos = new Map<string, ICrypto>();

/** wallet-btc address rules of a currency (script encoding, sizes, dust policy). */
export function cryptoFor(currencyId: string): ICrypto {
  let crypto = cryptos.get(currencyId);
  if (!crypto) {
    crypto = cryptoFactory(currencyId as Currency);
    cryptos.set(currencyId, crypto);
  }
  return crypto;
}

// BIP125 replaceability is only signalled where the network relays replacements.
const RBF_CURRENCIES: ReadonlySet<string> = new Set([
  "bitcoin",
  "bitcoin_testnet",
  "bitcoin_regtest",
]);

export const isRbfCurrency = (currencyId: string): boolean => RBF_CURRENCIES.has(currencyId);

/** nSequence of every input: 0 opts in to BIP125, 0xffffffff disables both RBF and locktime. */
export const inputSequence = (currencyId: string): number =>
  isRbfCurrency(currencyId) ? 0 : 0xffffffff;

const EXTRA_DATA_CURRENCIES: ReadonlySet<string> = new Set(["zencash", "zcash", "komodo"]);
const EXPIRY_HEIGHT_CURRENCIES: ReadonlySet<string> = new Set(["zcash", "komodo", "decred"]);

const bchExplicit = (str: string): string => {
  const explicit = str.includes(":") ? str : "bitcoincash:" + str;
  try {
    const { type } = cashaddr.decode(explicit);
    if (type === "P2PKH") return explicit;
  } catch {
    // not a cashaddr
  }
  return str;
};

function coinAdditionals(currencyId: string, recipient: string): string[] {
  switch (currencyId) {
    case "zcash":
    case "komodo":
      return ["sapling"];
    case "bitcoin_gold":
      return ["bip143"];
    case "bitcoin_cash":
      return bchExplicit(recipient).startsWith("bitcoincash:")
        ? ["bip143", "cashaddr"]
        : ["bip143"];
    default:
      return [];
  }
}

export type SigningRules = {
  sigHashType: number;
  segwit: boolean;
  additionals: string[];
  hasExtraData: boolean;
  /** Hex encoded, four zero bytes, for the coins whose transactions carry one. */
  expiryHeight?: string;
  lockTime?: number;
};

/** What the device needs besides the inputs and outputs to sign a transaction of this currency. */
export function signingRules(
  currencyId: string,
  derivationMode: BitcoinDerivationMode,
  recipient: string,
  now: number = Date.now(),
): SigningRules {
  const sigHashType = getNetworkParameters(currencyId).sigHash;
  if (Number.isNaN(sigHashType)) {
    throw new TypeError("sigHashType should not be NaN");
  }

  const additionals = [currencyId];
  if (derivationMode === "Native SegWit") additionals.push("bech32");
  if (derivationMode === "Taproot") additionals.push("bech32m");
  additionals.push(...coinAdditionals(currencyId, recipient));

  return {
    sigHashType,
    segwit: derivationMode !== "Legacy",
    additionals,
    hasExtraData: EXTRA_DATA_CURRENCIES.has(currencyId),
    ...(EXPIRY_HEIGHT_CURRENCIES.has(currencyId) ? { expiryHeight: "00000000" } : {}),
    // (legacy) Komodo: a lockTime lets the UTXOs created here claim their rewards.
    ...(currencyId === "komodo" ? { lockTime: Math.floor(now / 1000) - 777 } : {}),
  };
}
