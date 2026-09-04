// The web-tools composition root for the account-data layer.

import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import {
  createAccountBalanceSources,
  createAccountOperationsSources,
} from "@ledgerhq/live-common/account-data/sources";
import { accountBalancesSlice, type AccountBalance } from "@domain/entity-account-balance";
import {
  registerAccountBalanceSources,
  registerAccountOperationsSources,
} from "@features/platform-account-data";
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
const hostAccess = {
  // Unlike the wallets, this app has no account store — an id is enough to shape one.
  getAccount: (accountId: string) => shapedAccounts.get(accountId) ?? inferAccount(accountId),
  prepareCurrency: (currency: CryptoCurrency) => bridgeCache.prepareCurrency(currency),
};

registerAccountBalanceSources(createAccountBalanceSources(hostAccess));

/**
 * History, with the granular path **on** for the families the wallet already routes through the
 * coin framework.
 *
 * The wallets keep it off — `listOperations` parity is unproven, and a wallet must not risk a
 * history with a hole in it. This is a developer playground, and its whole job is to make the
 * difference between the two sources observable, which it cannot do if only one of them ever runs.
 */
registerAccountOperationsSources(
  createAccountOperationsSources({
    ...hostAccess,
    granularOperationFamilies: getEnabledGenericCoinFrameworkFamilies,
  }),
);
