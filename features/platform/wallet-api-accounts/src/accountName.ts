import type { AccountEntry } from "@domain/entity-account";
import {
  getDefaultAccountNameForCurrencyIndex,
  type AccountNamesState,
} from "@domain/entity-account-name";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

/** The account level of a BIP44 path, `m/purpose/coin/account…`: what the default name counts from. */
const accountIndexOf = (path: string): number =>
  Number.parseInt(path.split("/")[3] ?? "0", 10) || 0;

/** The name the user gave, else the default one, as `Ethereum 2`. */
export function accountNameOf(names: AccountNamesState, entry: AccountEntry): string {
  const given = entry.legacyId && names.get(entry.legacyId);
  if (given) return given;
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(entry.descriptor.network));
  return getDefaultAccountNameForCurrencyIndex({
    currency,
    index: accountIndexOf(entry.descriptor.path),
  });
}
