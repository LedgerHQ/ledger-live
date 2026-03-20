import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";

export const MAX_ACCOUNT_NAME_LENGTH = 50;

export const normalizeName = (name: string): string =>
  name.replace(/\s+/g, " ").trim().slice(0, MAX_ACCOUNT_NAME_LENGTH);

/**
 * Get the default name for an account.
 */
export const getDefaultAccountNameForCurrencyIndex = ({
  currency,
  index,
}: {
  currency: CryptoCurrency;
  index: number;
}): string => {
  return `${currency.name} ${index + 1}`;
};

export const validateNameEdition = (
  account: AccountLike,
  name?: string | null | undefined,
): string =>
  normalizeName(name || getDefaultAccountName(account) || "").slice(0, MAX_ACCOUNT_NAME_LENGTH);

export const getDefaultAccountName = (account: AccountLike) => {
  if (account.type === "Account") {
    return getDefaultAccountNameForCurrencyIndex(account);
  }
  return account.token.name;
};
