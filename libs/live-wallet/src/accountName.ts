import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";

const MAX_ACCOUNT_NAME_SIZE = 50;

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

export const validateNameEdition = (account: Account, name?: string | null | undefined): string =>
  ((name || "").replace(/\s+/g, " ").trim() || getDefaultAccountName(account)).slice(
    0,
    MAX_ACCOUNT_NAME_SIZE,
  );

export const getDefaultAccountName = (account: AccountLike) => {
  if (account.type === "Account") {
    return getDefaultAccountNameForCurrencyIndex(account);
  }
  return account.token.name;
};
