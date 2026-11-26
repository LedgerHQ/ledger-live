import {
  accountsSlice,
  selectDiscoveredAccountDescriptor,
  type AccountsState,
  type AccountUUID,
  type DiscoveredAccountsState,
} from "@domain/entity-account";

/** Both apps mount the accounts slice at `accountEntries`, and the discovered accounts at their name. */
export type WithAccountEntries = {
  accountEntries: AccountsState;
  discoveredAccounts: DiscoveredAccountsState;
};

const { selectAccountEntry } = accountsSlice.getSelectors(
  (state: WithAccountEntries) => state.accountEntries,
);

/** From the slices that hold one: the accounts, then the accounts discovery found. */
export const selectAccountDescriptor = (state: WithAccountEntries, accountUUID: AccountUUID) =>
  selectAccountEntry(state, accountUUID)?.descriptor ??
  selectDiscoveredAccountDescriptor(state, accountUUID);
