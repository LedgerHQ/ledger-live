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

// `inferAccount` throws on an id it cannot shape; the source contract is `Account | undefined`.
function inferredAccount(accountId: string) {
  try {
    return inferAccount(accountId);
  } catch {
    return undefined;
  }
}

const hostAccess = {
  getAccount: (accountId: string) => shapedAccounts.get(accountId) ?? inferredAccount(accountId),
  prepareCurrency: (currency: CryptoCurrency) => bridgeCache.prepareCurrency(currency),
};

registerAccountBalanceSources(createAccountBalanceSources(hostAccess));

registerAccountOperationsSources(
  createAccountOperationsSources({
    ...hostAccess,
    granularOperationFamilies: getEnabledGenericCoinFrameworkFamilies,
  }),
);
