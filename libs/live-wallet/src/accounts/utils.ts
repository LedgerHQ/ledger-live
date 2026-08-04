import type { AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getDefaultAccountNameForCurrencyIndex } from "@domain/entity-account-name";

export const accountRawToAccountUserData = (raw: AccountRaw): AccountUserData => {
  const { id } = raw;
  const name =
    raw.name ||
    getDefaultAccountNameForCurrencyIndex({
      currency: getCryptoCurrencyById(raw.currencyId),
      index: raw.index,
    });
  const starredIds: string[] = [];
  if (raw.starred) {
    starredIds.push(raw.id);
  }
  for (const t of raw.subAccounts || []) {
    if (t.starred) {
      starredIds.push(t.id);
    }
  }
  return { id, name, starredIds };
};
