import { accountsSlice, type AccountsState, type AccountUUID } from "@domain/entity-account";

/** Both apps mount the accounts slice at `accountEntries`. */
export type WithAccountEntries = { accountEntries: AccountsState };

const { selectAccountEntry } = accountsSlice.getSelectors(
  (state: WithAccountEntries) => state.accountEntries,
);

export const selectAccountDescriptor = (state: WithAccountEntries, accountUUID: AccountUUID) =>
  selectAccountEntry(state, accountUUID)?.descriptor;
