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
      }),

    // The compatibility half: today's full sync, read out of the legacy store rather than rebuilt.
    // Deliberately *not* writing the synced account back into the `accounts` reducer — `BridgeSync`
    // owns that store and a second writer would race it.
    syncAccountBalances: async (ref: AccountRef, signal?: AbortSignal) => {
      const state = store.getState();
      // Always a main account: `createLegacyBridgeSource` refuses a token-account ref, because this
      // source projects the parent's whole balance set and a token id must never key it.
      const account = accountSelector(state, { accountId: ref.accountId });
      if (!account) throw new Error(`account ${ref.accountId} is not in the store`);

      await prepareCurrency(account.currency);
      const bridge = await getAccountBridge(account);
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
 * Nothing on mobile reads the balance table through the layer yet. It is wired so that the first
 * screen that wants to costs a hook call rather than an integration.
 */
export function setupAccountData(store: StoreType): AccountDataScheduler {
  const registry = createAccountDataSourceRegistry(
    createDefaultAccountDataSources(accountDataHost(store)),
  );
  // Mobile keeps its accounts under `state.accounts.active`.
  mirrorLegacyAccountBalances(store, state => state.accounts.active);
  scheduler = createAccountDataScheduler({ registry, dispatch: store.dispatch });
  return scheduler;
}

/** The scheduler `setupAccountData` built, or `null` before boot has reached it. */
export function getAccountDataScheduler(): AccountDataScheduler | null {
  return scheduler;
}
