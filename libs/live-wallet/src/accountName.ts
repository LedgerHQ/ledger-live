import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

const MAX_ACCOUNT_NAME_SIZE = 50;

/**
 * Get the default name for an account.
 */
export const getDefaultAccountName = ({
  currency,
  index,
}: {
  currency: CryptoCurrency;
  index: number;
}): string => {
  return `${currency.name} ${index + 1}`;
};

export const validateNameEdition = (account: Account, name?: string | null | undefined): string =>
  (
    (name || account.name || "").replace(/\s+/g, " ").trim() ||
    account.name ||
    getDefaultAccountName(account)
  ).slice(0, MAX_ACCOUNT_NAME_SIZE);
