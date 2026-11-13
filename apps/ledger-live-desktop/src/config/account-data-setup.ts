import { createDynamicMiddleware, type Middleware } from "@reduxjs/toolkit";
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
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountsSelector, type AccountsState } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { State } from "~/renderer/reducers";

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** What can observe the account data layer. `AccountDataRecorder` matches it structurally. */
export type AccountDataObserver = {
  readonly middleware: Middleware;
  instrument(sources: readonly AccountDataSource[]): AccountDataSource[];
};

const dynamicMiddleware = createDynamicMiddleware();
let observer: AccountDataObserver | undefined;

/** The taps the store and the sources are built with. */
export const accountDataTaps: {
  /** A `createDynamicMiddleware()` middleware: `configureStore` installs it. */
  readonly middleware: Middleware;
  /** Plugs an observer into the store and the sources. A second call is a no-op. */
  observe(observer: AccountDataObserver): void;
} = {
  middleware: dynamicMiddleware.middleware,
  observe: next => {
    if (observer) return;
    observer = next;
    dynamicMiddleware.addMiddleware(next.middleware);
  },
};

/** The readers `current()` holds once it holds any, else `readers`. */
function forwarded<T extends object>(readers: T, current: () => T | undefined): T {
  return new Proxy(readers, { get: (target, kind) => Reflect.get(current() ?? target, kind) });
}

/** The same sources, forwarding their reads to `observer.instrument(sources)` once observed. */
function tapped(sources: readonly AccountDataSource[]): readonly AccountDataSource[] {
  let instrumented: readonly AccountDataSource[] | undefined;
  const current = (index: number) => {
    if (observer) instrumented ??= observer.instrument(sources);
    return instrumented?.[index];
  };
  return sources.map((source, index) => ({
    ...source,
    read: source.read && forwarded(source.read, () => current(index)?.read),
    readBatch: source.readBatch && forwarded(source.readBatch, () => current(index)?.readBatch),
  }));
}

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
      dispatch(updateAccountWithUpdater(accountId, updater)),
    blacklistedTokenIds,
  };
  return tapped([
    withCountervalues(
      createCoinModuleSource(createCoinModuleHost({ blacklistedTokenIds })),
      countervalues,
    ),
    withCountervalues(createFullSyncSource(fullSyncHost), countervalues),
  ]);
}

/** Keeps `accountEntries` in step with the legacy accounts. */
export function connectAccounts(store: AccountsReduxStore<{ accounts: AccountsState }>) {
  return connectAccountsStore(store, {
    selectLegacyAccounts: accountsSelector,
    toDescriptor: fromLegacyAccount,
    onError: error => logger.critical(error, "Account left out of the accounts slice"),
  });
}

/** Derives discovery candidates on the session of the Device Intent that runs the scan. */
export { deriveOnSession } from "@ledgerhq/live-common/account-data/discovery/deriveOnSession";
export { legacyScanRules } from "@ledgerhq/live-common/account-data/discovery/legacyScanRules";
