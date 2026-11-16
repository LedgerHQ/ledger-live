import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
  type BalanceLock,
} from "@domain/entity-account-balance";
import { loadBalanceLocksForFamily } from "../../coin-modules/registry";

export const toAmount = (value: BigNumber) => BigNumber.max(0, value).toFixed(0);

const toRow = (
  assetId: string,
  { balance, spendableBalance }: Pick<Account, "balance" | "spendableBalance">,
  locked?: BalanceLock[],
): AccountAssetBalance =>
  AccountAssetBalanceSchema.parse({
    assetId,
    balance: toAmount(balance),
    spendableBalance: toAmount(spendableBalance),
    ...(locked?.length ? { locked } : {}),
  });

/** The family's locks, left out rather than failing the balance when they can't be read. */
async function readBalanceLocks(account: Account): Promise<BalanceLock[] | undefined> {
  try {
    const balanceLocks = await loadBalanceLocksForFamily(account.currency.family);
    return balanceLocks?.(account);
  } catch {
    return undefined;
  }
}

/** The `balance` kind of a synced account: its native coin first, with the family's locks, then each of its token accounts. */
export async function toAccountBalances(account: Account): Promise<AccountAssetBalance[]> {
  return [
    toRow(account.currency.id, account, await readBalanceLocks(account)),
    ...(account.subAccounts ?? []).map(token => toRow(token.token.id, token)),
  ];
}
