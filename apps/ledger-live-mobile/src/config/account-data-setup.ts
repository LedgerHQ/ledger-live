import type { AccountDataSource } from "@domain/api-account-data";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { withCountervalues, type CountervaluesHost } from "@domain/api-market-countervalues";
import {
  accountsSlice,
  connectAccountsStore,
  type AccountsReduxStore,
} from "@domain/entity-account";
import { createCoinModuleSource } from "@features/platform-account-source-coin-module";
import { countervaluesStateSelector } from "@features/platform-market-countervalues";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { createCoinModuleHost } from "@ledgerhq/live-common/account-data/coin-module/createCoinModuleHost";
import {
  createFullSyncSource,
  type FullSyncHost,
} from "@ledgerhq/live-common/account-data/full-sync/createFullSyncSource";
import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { prepareCurrency } from "~/bridge/cache";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** The app's account data sources, in rank order: for each account, the first that serves it answers. */
export function accountDataSources(
  getState: () => State,
  dispatch: (action: { type: string }) => unknown,
): readonly AccountDataSource[] {
  const blacklistedTokenIds = () => blacklistedTokenIdsSelector(getState());
  const countervalues: CountervaluesHost = {
    rates: () => countervaluesStateSelector(getState()),
    findCurrency: assetId =>
      findCryptoCurrencyById(assetId) ?? getCryptoAssetsStore().findTokenById(assetId),
  };
  const fullSyncHost: FullSyncHost = {
    findAccount: accountUUID => {
      const state = getState();
      const legacyId = selectAccountEntry(state, accountUUID)?.legacyId;
      return legacyId === undefined
        ? undefined
        : accountsSelector(state).find(account => account.id === legacyId);
    },
    prepareCurrency,
    updateAccountWithUpdater: (accountId, updater) =>
      dispatch(updateAccountWithUpdater({ accountId, updater })),
    blacklistedTokenIds,
  };
  return [
    withCountervalues(
      createCoinModuleSource(createCoinModuleHost({ blacklistedTokenIds })),
      countervalues,
    ),
    withCountervalues(createFullSyncSource(fullSyncHost), countervalues),
  ];
}

/** Keeps `accountEntries` in step with the legacy accounts. */
export function connectAccounts(store: AccountsReduxStore<State>) {
  return connectAccountsStore(store, {
    selectLegacyAccounts: accountsSelector,
    toDescriptor: fromLegacyAccount,
    onError: error => {
      const message = "Account left out of the accounts slice";
      console.warn(message, error);
      // Not gated on `isDatadogEnabled`: importing `~/datadog` here is circular; a call before init is ignored.
      DdRum.addError(
        message,
        ErrorSource.SOURCE,
        error instanceof Error ? (error.stack ?? "") : "",
      );
    },
  });
}
