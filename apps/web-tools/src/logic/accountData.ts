import type { Account } from "@ledgerhq/types-live";
import { createAccountBalanceSources } from "@ledgerhq/live-common/account-data/sources";
import { accountBalancesSlice, type AccountBalance } from "@domain/entity-account-balance";
import { registerAccountBalanceSources } from "@features/platform-account-data";
import { AccountIdSchema } from "@domain/entity-account";
import { store } from "../store";
import { bridgeCache, inferAccount } from "./syncAccount";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

const shapedAccounts = new Map<string, Account>();

export function rememberShapedAccount(account: Account): void {
  shapedAccounts.set(account.id, account);
}

export function accountBalanceRowsOf(accountId: string): AccountBalance[] {
  const state = store.getState();
  const id = AccountIdSchema.parse(accountId);
  const own = accountBalancesSlice.selectors.selectAccountBalance(state, id);
  const subs = accountBalancesSlice.selectors.selectSubAccountBalances(state, id);
  return own ? [own, ...subs] : [...subs];
}

// `inferAccount` throws on an id it cannot shape; the source contract is `Account | undefined`, and
// the caller turns that into a legible "not in the store" rather than an opaque throw.
function inferredAccount(accountId: string) {
  try {
    return inferAccount(accountId);
  } catch {
    return undefined;
  }
}

registerAccountBalanceSources(
  createAccountBalanceSources({
    getAccount: accountId => shapedAccounts.get(accountId) ?? inferredAccount(accountId),
    prepareCurrency: currency => bridgeCache.prepareCurrency(currency),
  }),
);
