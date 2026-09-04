import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getAccountBalanceRows,
  syncAccountBalanceRows,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import {
  createAccountDataScheduler,
  createAccountDataSourceRegistry,
  createDefaultAccountDataSources,
  mirrorLegacyAccountBalances,
  observedBalanceAt,
  type AccountDataHost,
  type AccountDataScheduler,
  type AccountRef,
} from "@features/platform-account-data";
import { prepareCurrency } from "~/bridge/cache";
import { accountSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { StoreType } from "~/state-manager/configureStore";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

/**
 * This app's coin layer, as the account-data layer needs it.
 *
 * Identical in shape to the desktop host — deliberately. Only the store accessors and the bridge
 * cache differ, and the capability decision is read from the wallet's own gate in both, so the two
 * apps can never drift into disagreeing about which families are granular.
 */
function accountDataHost(store: StoreType): AccountDataHost {
  return {
    granularFamilies: getEnabledGenericCoinFrameworkFamilies,

    familyOf: currencyId => findCryptoCurrencyById(currencyId)?.family,

    readAssetBalances: ref =>
      getAccountBalanceRows({
        accountId: ref.accountId,
        currencyId: ref.currencyId,
        address: ref.address,
        blacklistedTokenIds: blacklistedTokenIdsSelector(store.getState()),
      }),

    // The compatibility half: today's full sync, read out of the legacy store rather than rebuilt, so
    // a family with no granular module behaves exactly as it does now. Deliberately *not* writing the
    // synced account back into the `accounts` reducer — `BridgeSync` owns that store.
    syncAccountBalances: async (ref: AccountRef, signal?: AbortSignal) => {
      const state = store.getState();
      // Always a main account: `createLegacyBridgeSource` refuses a token-account ref, because this
      // source projects the parent's whole balance set and a token id must never key it.
      const account = accountSelector(state, { accountId: ref.accountId });
      if (!account) throw new Error(`account ${ref.accountId} is not in the store`);

      await prepareCurrency(account.currency);
      return syncAccountBalanceRows({
        account,
        bridge: await getAccountBridge(account),
        blacklistedTokenIds: blacklistedTokenIdsSelector(state),
        signal,
      });
    },
  };
}

let scheduler: AccountDataScheduler | null = null;

/**
 * Wire the account-data layer for this app: register the standard sources, start mirroring the legacy
 * account store, and keep the scheduler for `<AccountDataProvider>` to pick up.
 *
 * Nothing on mobile reads the balance table through the layer yet. It is wired so that the first
 * screen that wants to costs a hook call rather than an integration.
 */
export function setupAccountData(store: StoreType): AccountDataScheduler {
  const registry = createAccountDataSourceRegistry(
    createDefaultAccountDataSources(accountDataHost(store)),
  );
  // Mobile keeps its accounts under `state.accounts.active`.
  mirrorLegacyAccountBalances(
    store,
    state => state.accounts.active,
    (error, accountId) => console.warn(`account-data: could not mirror ${accountId}`, error),
  );
  scheduler = createAccountDataScheduler({
    registry,
    dispatch: store.dispatch,
    // `BridgeSync` still owns background syncing, and the mirror stamps what it produces. Reading
    // that timestamp is what stops the first `useAccountBalance` from re-running a sync that just ran.
    observedAt: observedBalanceAt(store.getState),
    onError: (error, { ref, slice }) =>
      console.warn(`account-data: ${slice} failed for ${ref.accountId}`, error),
  });
  return scheduler;
}

/** The scheduler `setupAccountData` built, or `null` before boot has reached it. */
export function getAccountDataScheduler(): AccountDataScheduler | null {
  return scheduler;
}
