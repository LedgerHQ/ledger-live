import { fromEvent, lastValueFrom, NEVER, reduce, takeUntil } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountBalanceRows } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { toAccountBalances } from "@domain/entity-account-balance";
import {
  createAccountDataScheduler,
  createAccountDataSourceRegistry,
  createDefaultAccountDataSources,
  mirrorLegacyAccountBalances,
  type AccountDataHost,
  type AccountDataScheduler,
  type AccountRef,
} from "@features/platform-account-data";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { ReduxStore } from "~/state-manager/configureStore";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

/**
 * This app's coin layer, as the account-data layer needs it.
 *
 * The capability decision is `getEnabledGenericCoinFrameworkFamilies()` — the wallet's own gate, read
 * rather than copied, so no app carries a list of its own. Replacing it with a per-module declaration
 * is a change to this one line.
 */
function accountDataHost(store: ReduxStore): AccountDataHost {
  return {
    granularFamilies: getEnabledGenericCoinFrameworkFamilies,

    familyOf: currencyId => findCryptoCurrencyById(currencyId)?.family,

    readAssetBalances: ref =>
      getAccountBalanceRows({
        accountId: ref.accountId,
        currencyId: ref.currencyId,
        address: ref.address,
      }),

    // The compatibility half: today's full sync, read out of the legacy store rather than rebuilt, so
    // a family with no granular module behaves exactly as it does now. Deliberately *not* writing the
    // synced account back into the `accounts` reducer — `BridgeSync` owns that store and a second
    // writer would race it.
    syncAccountBalances: async (ref: AccountRef, signal?: AbortSignal) => {
      const state = store.getState();
      // Always a main account: `createLegacyBridgeSource` refuses a token-account ref, because this
      // source projects the parent's whole balance set and a token id must never key it.
      const account = accountSelector(state, { accountId: ref.accountId });
      if (!account) throw new Error(`account ${ref.accountId} is not in the store`);

      await prepareCurrency(account.currency);
      const bridge = await getAccountBridge(account);
      // A full sync is the expensive path, so honoring the abort matters here more than anywhere:
      // `takeUntil` unsubscribes the bridge observable, which is what actually stops the requests.
      const synced = await lastValueFrom(
        bridge
          .sync(account, {
            paginationConfig: {},
            blacklistedTokenIds: blacklistedTokenIdsSelector(state),
          })
          .pipe(
            takeUntil(signal ? fromEvent(signal, "abort") : NEVER),
            reduce<(account: Account) => Account, Account>((acc, updater) => updater(acc), account),
          ),
      );
      return toAccountBalances(synced);
    },
  };
}

let scheduler: AccountDataScheduler | null = null;

/**
 * Wire the account-data layer for this app: register the standard sources, start mirroring the legacy
 * account store, and keep the scheduler for `<AccountDataProvider>` to pick up.
 *
 * Same shape as `setupCryptoAssetsStore` — the app composition root owns the wiring, the package owns
 * the contract.
 */
export function setupAccountData(store: ReduxStore): AccountDataScheduler {
  const registry = createAccountDataSourceRegistry(
    createDefaultAccountDataSources(accountDataHost(store)),
  );
  // Desktop keeps `Account[]` directly at `state.accounts`.
  mirrorLegacyAccountBalances(store, state => state.accounts);
  scheduler = createAccountDataScheduler({ registry, dispatch: store.dispatch });
  return scheduler;
}

/** The scheduler `setupAccountData` built, or `null` before boot has reached it. */
export function getAccountDataScheduler(): AccountDataScheduler | null {
  return scheduler;
}
