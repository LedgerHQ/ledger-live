import type { AccountDataSource } from "@domain/api-account-data";
import { connectAccountsStore, type AccountsReduxStore } from "@domain/entity-account/legacy";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { accountsSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";

/** The app's account data sources, in rank order: for each account, the first that serves it answers. */
export const accountDataSources: readonly AccountDataSource[] = [];

/** Keeps `accountEntries` in step with the legacy accounts. */
export function connectAccounts(store: AccountsReduxStore<State>) {
  return connectAccountsStore(store, {
    selectLegacyAccounts: accountsSelector,
    toDescriptor: fromLegacyAccount,
    onError: error => console.warn("Account left out of the accounts slice", error),
  });
}
