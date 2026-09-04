// The web-tools composition root for the account-data layer.

import type { Account } from "@ledgerhq/types-live";
import { createAccountBalanceSources } from "@ledgerhq/live-common/account-data/sources";
import { accountBalancesSlice, type AccountBalance } from "@domain/entity-account-balance";
import { registerAccountBalanceSources } from "@features/platform-account-data";
import { AccountIdSchema } from "@shared/schema-primitives";
import { store } from "../store";
import { bridgeCache, inferAccount } from "./syncAccount";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

/**
 * Accounts a page has already shaped — from a Ledger Sync descriptor, say.
 *
 * The full-sync fallback needs a real `Account`, and `inferAccount` can only guess one from an id
 * (index 0, derived fresh address). When a caller already holds the properly shaped account, it
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
  const own = accountBalancesSlice.selectors.selectAccountBalance(state, id);
  const subs = accountBalancesSlice.selectors.selectSubAccountBalances(state, id);
  return own ? [own, ...subs] : [...subs];
}

/**
 * Registering both sources is what makes the selection observable in `/sync`: a family with a
 * granular coin module gets its balance from one chain call, every other family falls back to the
 * full sync it needs anyway, and `sourceId` on the status says which one answered.
 */
registerAccountBalanceSources(
  createAccountBalanceSources({
    // Unlike the wallets, this app has no account store — an id is enough to shape one.
    getAccount: accountId => shapedAccounts.get(accountId) ?? inferAccount(accountId),
    prepareCurrency: currency => bridgeCache.prepareCurrency(currency),
  }),
);
