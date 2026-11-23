import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { descriptorOf, toyReducer } from "@domain/api-account-data/testing";
import { accountsSlice, remoteAccountsAdded } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor/descriptor";
import { computeAccountUUID } from "@domain/entity-account-descriptor/schema.mock";

/** The toy accounts the test store holds. */
export const accounts = [0, 1, 2, 3].map(index => descriptorOf(index));

export const uuidOf = (index: number) => computeAccountUUID(descriptorOf(index));

/** The toy store of `@domain/api-account-data/testing`, its accounts slice holding `held`. */
export function makeStoreWithAccounts(
  sources: readonly AccountDataSource[],
  held: readonly AccountDescriptor[] = accounts,
) {
  const entries = held.map(descriptor => ({
    accountUUID: computeAccountUUID(descriptor),
    descriptor,
  }));
  return configureStore({
    reducer: { ...toyReducer, accountEntries: accountsSlice.reducer },
    preloadedState: {
      accountEntries: accountsSlice.reducer(undefined, remoteAccountsAdded(entries)),
    },
    middleware: getDefault => getDefault({ thunk: { extraArgument: accountDataExtra(sources) } }),
  });
}
