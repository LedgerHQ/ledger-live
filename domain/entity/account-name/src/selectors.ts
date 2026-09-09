import { parseAnyAccountId } from "@domain/entity-account";
import { type AccountNamesState } from "./schema";
import { getDefaultAccountName, type AccountForName } from "./accountName";

export const accountNameSelector = (
  state: AccountNamesState,
  { accountId }: { accountId: string },
): string | undefined => state.get(parseAnyAccountId(accountId));

export const accountNameWithDefaultSelector = (
  state: AccountNamesState,
  account: AccountForName,
): string => state.get(parseAnyAccountId(account.id)) || getDefaultAccountName(account);
