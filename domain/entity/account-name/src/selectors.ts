import {
  accountsSlice,
  parseAnyAccountId,
  type AccountEntry,
  type AccountsState,
} from "@domain/entity-account";
import { type AccountNamesState } from "./schema";
import { getDefaultAccountName, type AccountForName } from "./accountName";

const { selectAccountEntry } = accountsSlice.getSelectors();

export const accountNameSelector = (
  state: AccountNamesState,
  { accountId }: { accountId: string },
): string | undefined => state.get(parseAnyAccountId(accountId));

export const accountNameWithDefaultSelector = (
  state: AccountNamesState,
  account: AccountForName,
): string => state.get(parseAnyAccountId(account.id)) || getDefaultAccountName(account);

/** Through the account's legacy id: a remote-only account has no name yet. */
export const selectAccountNameByUUID = (
  names: AccountNamesState,
  accounts: AccountsState,
  accountUUID: AccountEntry["accountUUID"],
): string | undefined => {
  const legacyId = selectAccountEntry(accounts, accountUUID)?.legacyId;
  return legacyId && names.get(legacyId);
};
