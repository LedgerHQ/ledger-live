// The web-tools composition root for the account-data layer.

import type { Account } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getAccountBalanceRows,
  syncAccountBalanceRows,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import {
  accountBalanceSelector,
  subAccountBalancesSelector,
  type AccountBalance,
} from "@domain/entity-account-balance";
import {
  createAccountDataScheduler,
  createAccountDataSourceRegistry,
  createDefaultAccountDataSources,
  observedBalanceAt,
  type AccountDataHost,
  type AccountRef,
} from "@features/platform-account-data";
import { AccountIdSchema } from "@shared/schema-primitives";
import { store } from "../store";
import { bridgeCache, inferAccount } from "./syncAccount";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

/**
 * Accounts a page has already shaped — from a Ledger Sync descriptor, say.
 *
 * The legacy fallback needs a real `Account` to sync, and `inferAccount` can only guess one from an
 * id (index 0, derived fresh address). When a caller already holds the properly shaped account, it
 * hands it over here so the fallback syncs the right derivation path rather than a lookalike.
 */
const shapedAccounts = new Map<string, Account>();

export function rememberShapedAccount(account: Account): void {
  shapedAccounts.set(account.id, account);
}

/** The balance rows currently in the store for an account: its own first, then its token accounts. */
export function accountBalanceRowsOf(accountId: string): AccountBalance[] {
  const state = store.getState();
  const id = AccountIdSchema.parse(accountId);
  const own = accountBalanceSelector(state, { accountId: id });
  const subs = subAccountBalancesSelector(state, { accountId: id });
  return own ? [own, ...subs] : [...subs];
}

/**
 * This app's coin layer, as the account-data layer needs it.
 *
 * `getEnabledGenericCoinFrameworkFamilies()` is the wallet's own gate, read rather than copied — the
 * point of the shared host adapter is that no app carries a list of its own.
 */
function accountDataHost(): AccountDataHost {
  return {
    granularFamilies: getEnabledGenericCoinFrameworkFamilies,

    familyOf: currencyId => findCryptoCurrencyById(currencyId)?.family,

    readAssetBalances: ref =>
      getAccountBalanceRows({
        accountId: ref.accountId,
        currencyId: ref.currencyId,
        address: ref.address,
      }),

    // The compatibility half: today's full `AccountBridge.sync()`, projected onto balance rows.
    syncAccountBalances: async (ref: AccountRef, signal?: AbortSignal) => {
      const account = shapedAccounts.get(ref.accountId) ?? inferAccount(ref.accountId);
      const bridge = await getAccountBridge(account);
      await bridgeCache.prepareCurrency(account.currency);
      return syncAccountBalanceRows({ account, bridge, signal });
    },
  };
}

/**
 * The app-wide scheduler. Created at module scope because this app's store is too.
 *
 * Registering both sources is what makes the routing observable in the devtool: a family with a
 * granular coin module gets its balance from one chain call, and every other family falls back to the
 * full sync it needs anyway — with `sourceId` on the status telling you which one answered.
 */
export const accountDataScheduler = createAccountDataScheduler({
  registry: createAccountDataSourceRegistry(createDefaultAccountDataSources(accountDataHost())),
  dispatch: store.dispatch,
  observedAt: observedBalanceAt(store.getState),
  onError: (error, { ref, reason }) =>
    console.warn(`account-data: ${ref.accountId} (${reason})`, error),
});
