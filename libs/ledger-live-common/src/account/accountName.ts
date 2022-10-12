import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, DerivationMode } from "@ledgerhq/types-live";

const MAX_ACCOUNT_NAME_SIZE = 50;
export const getAccountPlaceholderName = ({
  currency,
  index,
}: {
  currency: CryptoCurrency;
  index: number;
  derivationMode: DerivationMode;
}): string => {
  return `${currency.name} ${index + 1}`;
};
export const getNewAccountPlaceholderName = getAccountPlaceholderName; // same naming

export const validateNameEdition = (
  account: Account,
  name?: string | null | undefined
): string =>
  (
    (name || account.name || "").replace(/\s+/g, " ").trim() ||
    account.name ||
    getAccountPlaceholderName(account)
  ).slice(0, MAX_ACCOUNT_NAME_SIZE);
