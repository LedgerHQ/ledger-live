export const MAX_ACCOUNT_NAME_LENGTH = 50;

export type AccountForName = {
  id: string;
  type: string;
  currency?: { name: string };
  index?: number;
  token?: { name: string };
};

export const normalizeName = (name: string): string =>
  name.replace(/\s+/g, " ").trim().slice(0, MAX_ACCOUNT_NAME_LENGTH);

export const getDefaultAccountNameForCurrencyIndex = ({
  currency,
  index,
}: {
  currency: { name: string };
  index: number;
}): string => `${currency.name} ${index + 1}`;

export const getDefaultAccountName = (account: AccountForName): string => {
  if (account.type === "Account" && account.currency && account.index !== undefined) {
    return getDefaultAccountNameForCurrencyIndex({
      currency: account.currency,
      index: account.index,
    });
  }
  return account.token?.name ?? account.id;
};

export const validateNameEdition = (
  account: AccountForName,
  name?: string | null | undefined,
): string =>
  normalizeName(name || getDefaultAccountName(account) || "").slice(0, MAX_ACCOUNT_NAME_LENGTH);
