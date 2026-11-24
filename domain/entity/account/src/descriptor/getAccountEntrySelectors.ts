import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { accountsAdapter } from "../adapter";
import type { AccountUUID } from "../accountUUID";
import type { AccountEntry } from "../entry";
import type { AccountsState } from "../schema";

export type AccountEntrySelectors<S> = {
  /** Every account with its descriptor, in the user's order. */
  selectAccountEntries: (state: S) => AccountEntry[];
  selectAccountEntry: (state: S, accountUUID: AccountUUID) => AccountEntry | undefined;
  selectAccountDescriptor: (state: S, accountUUID: AccountUUID) => AccountDescriptor | undefined;
};

/** The selectors that hand out descriptors, bound to where the app mounts the slice: edges only. */
export function getAccountEntrySelectors<S>(
  selectState: (state: S) => AccountsState,
): AccountEntrySelectors<S> {
  const { selectAll, selectById } = accountsAdapter.getSelectors(selectState);
  return {
    selectAccountEntries: selectAll,
    selectAccountEntry: selectById,
    selectAccountDescriptor: (state, accountUUID) => selectById(state, accountUUID)?.descriptor,
  };
}
