import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  currencyIdFromNetwork,
  AccountDescriptorSchema,
  AddressSchema,
  type Address,
  networkFromCurrencyId,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import {
  asDerivationMode,
  derivationModeSupportsIndex,
  getDerivationModesForCurrency,
  getDerivationModeStartsAt,
  getDerivationScheme,
  runAccountDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { getAccountDescriptorType, loadAddressFromKeyForFamily } from "../coin-modules/registry";
import { resolveFamily } from "../bridge/zcashRouting";

/** Families keyed on their public key: their address cannot give back what reading the account needs. */
const PUBLIC_KEY_FAMILIES = new Set([
  "aptos",
  "canton",
  "concordium",
  "internet_computer",
  "stacks",
  "ton",
]);

/** The fields of a legacy `Account` that a descriptor can express. */
export type LegacyAccountIdentity = Pick<Account, "id" | "derivationMode" | "index" | "xpub"> & {
  currency: Pick<Account["currency"], "id">;
  freshAddress: string;
  /** Canton keeps its public key here: its legacy id holds the party id. */
  cantonResources?: { publicKey?: string };
};

export type LegacyAccountFields = {
  currencyId: string;
  derivationMode: DerivationMode;
  index: number;
  xpub?: string;
  freshAddress?: string;
  /** The key of a family keyed on its public key, in place of `freshAddress`: see `addressFromKey`. */
  publicKey?: string;
};

export class UnsupportedDescriptorPathError extends Error {
  override name = "UnsupportedDescriptorPathError";
}

export class MissingAccountXpubError extends Error {
  override name = "MissingAccountXpubError";
}

export class MissingAccountPublicKeyError extends Error {
  override name = "MissingAccountPublicKeyError";
}

/** A descriptor key that is not what its family is keyed on, as a public-key family's key written as an address. */
export class InvalidAccountKeyError extends Error {
  override name = "InvalidAccountKeyError";
}

const HEX_PUBLIC_KEY = /^([0-9a-f]{2})+$/i;

function assertPublicKey(key: string, currencyId: string): void {
  if (!HEX_PUBLIC_KEY.test(key)) {
    throw new InvalidAccountKeyError(`${currencyId} accounts are keyed on a hex public key`);
  }
}

/** The public key of the account, lowercase hex: its legacy id holds it, or an address, then `xpub` keeps it (Aptos). */
function publicKeyOf(account: LegacyAccountIdentity, family: string, currencyId: string): string {
  const candidates =
    family === "canton"
      ? [account.cantonResources?.publicKey]
      : [decodeAccountId(account.id).xpubOrAddress, account.xpub];
  const key = candidates.find(candidate => candidate && HEX_PUBLIC_KEY.test(candidate));
  if (!key) {
    throw new MissingAccountPublicKeyError(
      `${currencyId} account has no public key to identify it`,
    );
  }
  return key.toLowerCase();
}

/** A public-key family whose address is not computed from its key, but looked up on chain or held as state (Concordium, Canton). */
export class UnsupportedAddressFromKeyError extends Error {
  override name = "UnsupportedAddressFromKeyError";
}

/** The address an account is read at: its key, or the address its family computes from its public key. */
export async function addressFromKey(currencyId: string, key: string): Promise<Address> {
  const family = resolveFamily(getCryptoCurrencyById(currencyId));
  if (!PUBLIC_KEY_FAMILIES.has(family)) return AddressSchema.parse(key);
  assertPublicKey(key, currencyId);
  const derive = await loadAddressFromKeyForFamily(family);
  if (!derive) {
    throw new UnsupportedAddressFromKeyError(`${currencyId} computes no address from its key`);
  }
  return AddressSchema.parse(derive(key));
}

/** A legacy derivation path ("44'/60'/0'/0/0", with or without "m/") as a descriptor path. */
export const toDescriptorPath = (path: string) =>
  `m/${path.replace(/^m\//, "").replaceAll("'", "h")}`;
const fromDescriptorPath = (path: string) => (path.startsWith("m/") ? path.slice(2) : path);

const stripHardened = (segment: string) => (segment.endsWith("h") ? segment.slice(0, -1) : segment);

/** Account index of `path` if it follows `scheme` (only a utxo path may stop before `<node>/<address>`), else null. */
function matchSchemeToPath(
  scheme: string,
  coinType: number,
  path: string,
  allowTruncated: boolean,
): number | null {
  const schemeSegments = scheme.split("/").map(s => s.replaceAll("'", "h"));
  const pathSegments = path.split("/");
  if (pathSegments.length > schemeSegments.length) return null;

  let accountIndex = 0;
  for (const [i, s] of schemeSegments.entries()) {
    const p = pathSegments[i];
    const base = stripHardened(s);
    if (p === undefined) {
      if (!allowTruncated || (base !== "<node>" && base !== "<address>")) return null;
      continue;
    }
    if (s.endsWith("h") !== p.endsWith("h")) return null;
    if (base === "<coin_type>") {
      if (Number.parseInt(stripHardened(p), 10) !== coinType) return null;
    } else if (base === "<account>") {
      accountIndex = Number.parseInt(stripHardened(p), 10);
    } else if (base !== "<node>" && base !== "<address>" && s !== p) {
      return null;
    }
  }
  return accountIndex;
}

export function fromLegacyAccount(account: LegacyAccountIdentity): AccountDescriptor {
  return AccountDescriptorSchema.parse(buildDescriptor(account));
}

function buildDescriptor(account: LegacyAccountIdentity): AccountDescriptor {
  const currency = getCryptoCurrencyById(account.currency.id);
  const network = networkFromCurrencyId(CryptoCurrencyIdSchema.parse(account.currency.id));
  const derivationMode = asDerivationMode(account.derivationMode);
  const scheme = getDerivationScheme({ derivationMode, currency });
  const family = resolveFamily(currency);

  if (getAccountDescriptorType(family) === "utxo") {
    if (!account.xpub) {
      throw new MissingAccountXpubError(`${currency.id} account has no xpub to identify it`);
    }
    return {
      purpose: "account",
      version: "2",
      type: "utxo",
      network,
      key: account.xpub,
      path: toDescriptorPath(
        runAccountDerivationScheme(scheme, currency, { account: account.index }),
      ),
    };
  }
  return {
    purpose: "account",
    version: "2",
    type: "address",
    network,
    key: PUBLIC_KEY_FAMILIES.has(family)
      ? publicKeyOf(account, family, currency.id)
      : account.freshAddress,
    path: toDescriptorPath(
      runDerivationScheme(scheme, { coinType: currency.coinType }, { account: account.index }),
    ),
  };
}

/** Lossy for address descriptors: the path is account-level, so `freshAddressPath` is not restored until the next sync. A public-key family gets its key, not its address. */
export function toLegacyAccount(input: AccountDescriptor): LegacyAccountFields {
  const descriptor = AccountDescriptorSchema.parse(input);
  const currencyId = currencyIdFromNetwork(descriptor.network);
  const currency = getCryptoCurrencyById(currencyId);
  const family = resolveFamily(currency);
  const expectedType = getAccountDescriptorType(family);
  if (descriptor.type !== expectedType) {
    throw new UnsupportedDescriptorPathError(
      `${currencyId} accounts use ${expectedType} descriptors, got ${descriptor.type}`,
    );
  }
  const keyedOnPublicKey = PUBLIC_KEY_FAMILIES.has(family);
  if (keyedOnPublicKey) assertPublicKey(descriptor.key, currencyId);
  const path = fromDescriptorPath(descriptor.path);

  for (const derivationMode of getDerivationModesForCurrency(currency)) {
    const scheme = getDerivationScheme({ derivationMode, currency });
    const index = matchSchemeToPath(scheme, currency.coinType, path, descriptor.type === "utxo");
    if (index === null || !derivationModeSupportsIndex(derivationMode, index)) continue;
    if (index < getDerivationModeStartsAt(derivationMode)) continue;
    if (descriptor.type === "utxo")
      return { currencyId, derivationMode, index, xpub: descriptor.key };
    return keyedOnPublicKey
      ? { currencyId, derivationMode, index, publicKey: descriptor.key }
      : { currencyId, derivationMode, index, freshAddress: descriptor.key };
  }
  throw new UnsupportedDescriptorPathError(
    `No derivation mode of ${currencyId} matches path "${descriptor.path}"`,
  );
}
