import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getAccountBalanceRows,
  syncAccountBalanceRows,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import {
  registerAccountBalanceSources,
  type AccountBalanceSource,
  type AccountRef,
} from "@features/platform-account-data";
import { prepareCurrency } from "~/bridge/cache";
import { accountSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { StoreType } from "~/state-manager/configureStore";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

/**
 * Wire the account-data layer for this app.
 *
 * Identical in shape to the desktop composition root — deliberately. Only the store accessors and
 * the bridge cache differ, and the capability decision is read from the wallet's own gate in both,
 * so the two apps cannot drift into disagreeing about which families are granular.
 *
 * Nothing on mobile reads the balance table yet. It is wired so that the first screen that wants to
 * costs a hook call rather than an integration.
 */
export function setupAccountData(store: StoreType): void {
  const granularFamilies = new Set(getEnabledGenericCoinFrameworkFamilies());
  const familyOf = (currencyId: string) => findCryptoCurrencyById(currencyId)?.family;

  const granular: AccountBalanceSource = {
    id: "granular",
    priority: 10,
    supports: ref => {
      const family = familyOf(ref.currencyId);
      return !ref.parentId && family !== undefined && granularFamilies.has(family);
    },
    getBalances: ref =>
      getAccountBalanceRows({
        accountId: ref.accountId,
        currencyId: ref.currencyId,
        address: ref.address,
        blacklistedTokenIds: blacklistedTokenIdsSelector(store.getState()),
      }),
  };

  /**
   * Today's full sync, behind the same contract. Deliberately *not* writing the synced account back
   * into the `accounts` reducer: `BridgeSync` owns that store.
   */
  const fullSync: AccountBalanceSource = {
    id: "full-sync",
    priority: 0,
    supports: ref => !ref.parentId && familyOf(ref.currencyId) !== undefined,
    getBalances: async (ref: AccountRef, signal?: AbortSignal) => {
      const state = store.getState();
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

  registerAccountBalanceSources([granular, fullSync]);
}
