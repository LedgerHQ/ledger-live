import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import type {
  AggregatedAccountEntry,
  CalculateCountervalue,
} from "@ledgerhq/asset-aggregation/index";

/** Reads one asset's balance from the stored rows; the account's own value stands in until the read lands. */
function balanceOf(
  rows: readonly AccountAssetBalance[] | undefined,
  assetId: string,
  fallback: BigNumber,
): BigNumber {
  const row = rows?.find(candidate => candidate.assetId === assetId);
  return row ? new BigNumber(row.balance) : fallback;
}

export function getAccountDataNativeBalance(
  account: Account,
  rows: readonly AccountAssetBalance[] | undefined,
): BigNumber {
  return balanceOf(rows, account.currency.id, account.balance);
}

export function computeAccountDataAggregatedEntry(
  account: Account,
  rows: readonly AccountAssetBalance[] | undefined,
  calculateCountervalue: CalculateCountervalue,
): AggregatedAccountEntry {
  const nativeBalance = getAccountDataNativeBalance(account, rows);
  let countervalue = new BigNumber(calculateCountervalue(account.currency, nativeBalance) ?? 0);

  const subs = account.subAccounts ?? [];
  for (const sub of subs) {
    const subBalance = balanceOf(rows, sub.token.id, sub.balance);
    countervalue = countervalue.plus(calculateCountervalue(sub.token, subBalance) ?? 0);
  }

  return { countervalue, subAccountsCount: subs.length };
}

export function computeAccountDataAggregatedAccounts(
  accounts: readonly Account[],
  rowsByAccountId: ReadonlyMap<string, readonly AccountAssetBalance[] | undefined>,
  calculateCountervalue: CalculateCountervalue,
): Map<string, AggregatedAccountEntry> {
  return new Map(
    accounts.map(account => [
      account.id,
      computeAccountDataAggregatedEntry(
        account,
        rowsByAccountId.get(account.id),
        calculateCountervalue,
      ),
    ]),
  );
}
