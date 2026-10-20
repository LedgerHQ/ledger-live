import { createAccountDataRecorder } from "@devtools/bindings";
import type { AccountDataSource } from "@domain/api-account-data";
import {
  accountsSlice,
  connectAccountsStore,
  type AccountsReduxStore,
} from "@domain/entity-account";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { createFullSyncSource } from "@ledgerhq/live-common/account-data/full-sync/createFullSyncSource";
import { createLegacyExistenceSource } from "@ledgerhq/live-common/account-data/discovery/createLegacyExistenceSource";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountsSelector, type AccountsState } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { State } from "~/renderer/reducers";

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** What the account data layer does, for the DevTools account-data page. */
export const accountDataRecorder = createAccountDataRecorder();

/** The app's account data sources, in rank order: for each account, the first that serves it answers. */
export function accountDataSources(getState: () => State): readonly AccountDataSource[] {
  return accountDataRecorder.instrument([
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
    createLegacyExistenceSource({
      prepareCurrency,
      blacklistedTokenIds: () => blacklistedTokenIdsSelector(getState()),
    }),
  ]);
}

/** Keeps `accountEntries` in step with the legacy accounts. */
export function connectAccounts(store: AccountsReduxStore<{ accounts: AccountsState }>) {
  return connectAccountsStore(store, {
    selectLegacyAccounts: accountsSelector,
    toDescriptor: fromLegacyAccount,
    onError: error => console.warn("Account left out of the accounts slice", error),
  });
}
