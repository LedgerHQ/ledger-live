import type { AccountsState } from "@domain/entity-account";
import { getAccountEntrySelectors } from "@domain/entity-account/descriptor";

/** Both apps mount the accounts slice at `accountEntries`. */
export type WithAccountEntries = { accountEntries: AccountsState };

export const { selectAccountDescriptor } = getAccountEntrySelectors(
  (state: WithAccountEntries) => state.accountEntries,
);
