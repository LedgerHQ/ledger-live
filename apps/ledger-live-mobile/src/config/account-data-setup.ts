import type { AccountDataSource } from "@domain/api-account-data";
import {
  accountsSlice,
  connectAccountsStore,
  type AccountsReduxStore,
} from "@domain/entity-account";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { createFullSyncSource } from "@ledgerhq/live-common/account-data/full-sync/createFullSyncSource";
import { prepareCurrency } from "~/bridge/cache";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** The app's account data sources, in rank order: for each account, the first that serves it answers. */
export function accountDataSources(getState: () => State): readonly AccountDataSource[] {
  return [
    createFullSyncSource({
      findAccount: accountUUID => {
        const state = getState();
        const legacyId = selectAccountEntry(state, accountUUID)?.legacyId;
        return legacyId === undefined
          ? undefined
          : accountsSelector(state).find(account => account.id === legacyId);
      },
      prepareCurrency,
      blacklistedTokenIds: () => blacklistedTokenIdsSelector(getState()),
    }),
  ];
}

/** Keeps `accountEntries` in step with the legacy accounts. */
export function connectAccounts(store: AccountsReduxStore<State>) {
  return connectAccountsStore(store, {
    selectLegacyAccounts: accountsSelector,
    toDescriptor: fromLegacyAccount,
    onError: error => console.warn("Account left out of the accounts slice", error),
  });
}
