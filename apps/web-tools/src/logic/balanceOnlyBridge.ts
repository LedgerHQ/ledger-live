import BigNumber from "bignumber.js";
import { from, type Observable } from "rxjs";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { fetchAccountBalance } from "@features/platform-account-data";
import { store } from "../store";
import { accountBalanceRowsOf, accountRefOf, rememberShapedAccount } from "./accountData";

async function resolveBalanceUpdater(account: Account): Promise<(_: Account) => Account> {
  rememberShapedAccount(account);
  const ref = accountRefOf(account);
  await store.dispatch(fetchAccountBalance(ref, { maxAge: 0 }));

  const { error } = accountBalancesSlice.selectors.selectAccountBalanceStatus(
    store.getState(),
    ref.accountId,
  );
  if (error) throw new Error(error);

  const own = accountBalanceRowsOf(account.id).find(row => row.accountId === account.id);
  if (!own) throw new Error(`no balance could be resolved for ${account.id}`);

  return current => ({
    ...current,
    balance: new BigNumber(own.balance),
    spendableBalance: new BigNumber(own.spendableBalance),
    lastSyncDate: new Date(),
  });
}

/**
 * An `AccountBridge` that can do exactly one thing: fill in a balance. Only `sync` is reachable from
 * Ledger Sync's resolution path, hence the cast — the rest of the surface throws rather than lie.
 *
 * Caveat: `integrateNewAccountDescriptor` used the full sync as a validation pass too, and a balance
 * read will not catch a descriptor that only a full sync would have found malformed.
 */
export function balanceOnlyAccountBridge<T extends TransactionCommon>(): AccountBridge<T> {
  const unsupported = (name: string) => () => {
    throw new Error(`balanceOnlyAccountBridge does not implement ${name}`);
  };

  return {
    sync: (initialAccount: Account): Observable<(_: Account) => Account> =>
      from(resolveBalanceUpdater(initialAccount)),
    receive: unsupported("receive"),
    createTransaction: unsupported("createTransaction"),
    updateTransaction: unsupported("updateTransaction"),
    prepareTransaction: unsupported("prepareTransaction"),
    getTransactionStatus: unsupported("getTransactionStatus"),
    estimateMaxSpendable: unsupported("estimateMaxSpendable"),
    signOperation: unsupported("signOperation"),
    broadcast: unsupported("broadcast"),
  } as unknown as AccountBridge<T>;
}
