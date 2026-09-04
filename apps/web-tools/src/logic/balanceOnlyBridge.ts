import BigNumber from "bignumber.js";
import { from, type Observable } from "rxjs";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { fetchAccountBalance } from "@features/platform-account-data";
import { store } from "../store";
import { accountBalanceRowsOf, accountRefOf, rememberShapedAccount } from "./accountData";

/**
 * Resolve just the balance of an account, through the account-data layer.
 *
 * `maxAge: 0` because this runs when a descriptor first arrives and the point is to read the chain,
 * not to serve whatever happens to be in the table.
 */
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
 * An `AccountBridge` that can do exactly one thing: fill in a balance.
 *
 * Ledger Sync resolves each incoming account descriptor by running a **full** `bridge.sync()` —
 * every operation, the balance-history cache, the family resource bag — and then displays a name and
 * a balance. `descriptorToAccount` already reconstructs every other field it needs with no network
 * at all, so the sync is paid for one number.
 *
 * Dropping this bridge into the accounts cloud-sync module's resolution context replaces that with a
 * one balance read through the account-data layer: a single `getBalance` call on a family with a
 * granular coin module, and the same full sync as before on families without one — the source is
 * picked per account, and `sourceId` on the status records which one answered.
 *
 * Two honest caveats:
 * - `integrateNewAccountDescriptor` used the full sync as a *validation* pass too. A balance read
 *   still rejects an unknown currency and a chain that cannot see the address, but it will not catch
 *   a descriptor that only a full sync would have found malformed.
 * - Only `sync` is reachable from that resolution path, hence the cast: the rest of the surface
 *   would be a lie, and it is better for it to throw than to pretend.
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
