import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { descriptorOf, toyReducer } from "@domain/api-account-data/testing";
import {
  accountsSlice,
  discoveredAccountsRegistered,
  discoveredAccountsSlice,
  remoteAccountsAdded,
} from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { computeAccountUUID } from "@domain/entity-account/schema.mock";

/** The toy accounts the test store holds. */
export const accounts = [0, 1, 2, 3].map(index => descriptorOf(index));

export const uuidOf = (index: number) => computeAccountUUID(descriptorOf(index));

const entriesOf = (descriptors: readonly AccountDescriptor[]) =>
  descriptors.map(descriptor => ({ accountUUID: computeAccountUUID(descriptor), descriptor }));

/** The toy store of `@domain/api-account-data/testing`, its accounts slice holding `held`, its discovered accounts `discovered`. */
export function makeStoreWithAccounts(
  sources: readonly AccountDataSource[],
  held: readonly AccountDescriptor[] = accounts,
  discovered: readonly AccountDescriptor[] = [],
) {
  return configureStore({
    reducer: {
      ...toyReducer,
      accountEntries: accountsSlice.reducer,
      discoveredAccounts: discoveredAccountsSlice.reducer,
    },
    preloadedState: {
      accountEntries: accountsSlice.reducer(undefined, remoteAccountsAdded(entriesOf(held))),
      discoveredAccounts: discoveredAccountsSlice.reducer(
        undefined,
        discoveredAccountsRegistered(entriesOf(discovered)),
      ),
    },
    middleware: getDefault => getDefault({ thunk: { extraArgument: accountDataExtra(sources) } }),
  });
}
