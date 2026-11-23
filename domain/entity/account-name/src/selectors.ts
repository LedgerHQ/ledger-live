import type { AccountUUID } from "@domain/entity-account-descriptor";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import { type AccountNamesState } from "./schema";

const { selectAccountLegacyId } = accountsSlice.getSelectors();

/** Through the account's legacy id: a remote-only account has no name yet. */
export const selectAccountNameByUUID = (
  names: AccountNamesState,
  accounts: AccountsState,
  accountUUID: AccountUUID,
): string | undefined => {
  const legacyId = selectAccountLegacyId(accounts, accountUUID);
  return legacyId && names.get(legacyId);
};
