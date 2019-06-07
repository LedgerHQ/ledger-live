// @flow
import type { Account, CryptoCurrency, DerivationMode } from "../types";
import { getTagDerivationMode } from "../derivation";

const MAX_ACCOUNT_NAME_SIZE = 50;

export const getAccountPlaceholderName = ({
  currency,
  index,
  derivationMode
}: {
  currency: CryptoCurrency,
  index: number,
  derivationMode: DerivationMode
}) => {
  const tag = getTagDerivationMode(currency, derivationMode);
  return `${currency.name} ${index + 1}${tag ? ` (${tag})` : ""}`;
};

export const getNewAccountPlaceholderName = getAccountPlaceholderName; // same naming

export const validateNameEdition = (account: Account, name: ?string): string =>
  (
    (name || account.name || "").replace(/\s+/g, " ").trim() ||
    account.name ||
    getAccountPlaceholderName(account)
  ).slice(0, MAX_ACCOUNT_NAME_SIZE);
