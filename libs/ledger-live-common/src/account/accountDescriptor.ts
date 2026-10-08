import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  currencyIdFromNetwork,
  AccountDescriptorSchema,
  networkFromCurrencyId,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import {
  asDerivationMode,
  derivationModeSupportsIndex,
  getDerivationModesForCurrency,
  getDerivationScheme,
  runAccountDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";

/** The fields of a legacy `Account` that a descriptor can express. */
export type LegacyAccountIdentity = Pick<Account, "derivationMode" | "index" | "xpub"> & {
  currency: Pick<Account["currency"], "id">;
  freshAddress: string;
};

export type LegacyAccountFields = {
  currencyId: string;
  derivationMode: DerivationMode;
  index: number;
  xpub?: string;
  freshAddress?: string;
};

export class UnsupportedDescriptorPathError extends Error {
  override name = "UnsupportedDescriptorPathError";
}

const toDescriptorPath = (schemePath: string) => `m/${schemePath.replaceAll("'", "h")}`;
const fromDescriptorPath = (path: string) => path.replace(/^m\//, "");

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
  const network = networkFromCurrencyId(account.currency.id);
  const derivationMode = asDerivationMode(account.derivationMode);
  const scheme = getDerivationScheme({ derivationMode, currency });

  if (currency.family === "bitcoin" && account.xpub) {
    return {
      purpose: "account",
      version: "1",
      type: "utxo",
      network,
      xpub: account.xpub,
      path: toDescriptorPath(
        runAccountDerivationScheme(scheme, currency, { account: account.index }),
      ),
    };
  }
  return {
    purpose: "account",
    version: "1",
    type: "address",
    network,
    address: account.freshAddress,
    path: toDescriptorPath(
      runDerivationScheme(scheme, { coinType: currency.coinType }, { account: account.index }),
    ),
  };
}

export function toLegacyAccount(descriptor: AccountDescriptor): LegacyAccountFields {
  const currencyId = currencyIdFromNetwork(descriptor.network);
  const currency = getCryptoCurrencyById(currencyId);
  const path = fromDescriptorPath(descriptor.path);

  for (const derivationMode of getDerivationModesForCurrency(currency)) {
    const scheme = getDerivationScheme({ derivationMode, currency });
    const index = matchSchemeToPath(scheme, currency.coinType, path, descriptor.type === "utxo");
    if (index === null || !derivationModeSupportsIndex(derivationMode, index)) continue;
    return descriptor.type === "utxo"
      ? { currencyId, derivationMode, index, xpub: descriptor.xpub }
      : { currencyId, derivationMode, index, freshAddress: descriptor.address };
  }
  throw new UnsupportedDescriptorPathError(
    `No derivation mode of ${currencyId} matches path "${descriptor.path}"`,
  );
}
