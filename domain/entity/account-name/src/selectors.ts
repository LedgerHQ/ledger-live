import { type AccountNamesState } from "./schema";
import { getDefaultAccountName, type AccountForName } from "./accountName";

export const accountNameSelector = (
  state: AccountNamesState,
  { accountId }: { accountId: string },
): string | undefined => state.get(accountId);

export const accountNameWithDefaultSelector = (
  state: AccountNamesState,
  account: AccountForName,
): string => state.get(account.id) || getDefaultAccountName(account);
