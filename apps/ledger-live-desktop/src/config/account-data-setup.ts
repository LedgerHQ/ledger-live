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
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { ReduxStore } from "~/state-manager/configureStore";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

/**
 * Wire the account-data layer for this app.
 *
 * Same shape as `setupCryptoAssetsStore` — the app composition root owns the wiring, the package
 * owns the contract. Called once at boot; nothing else in the app registers a source.
 */
export function setupAccountData(store: ReduxStore): void {
  // Resolved once: the set is static for the life of the app, and asking on every `supports` check
  // would put a lookup on the hot path of every portfolio row. It is the *wallet's* own gate, read
  // rather than copied — no app carries a family list of its own.
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
   * Today's full sync, behind the same contract — the guarantee that this layer is never worse than
   * what it replaces.
   *
   * Deliberately *not* writing the synced account back into the `accounts` reducer: `BridgeSync`
   * owns that store, and a second writer racing it is exactly what this exploration exists to avoid.
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
