import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";

export const toAmount = (value: BigNumber) => BigNumber.max(0, value).toFixed(0);

const toRow = (
  assetId: string,
  { balance, spendableBalance }: Pick<Account, "balance" | "spendableBalance">,
): AccountAssetBalance =>
  AccountAssetBalanceSchema.parse({
    assetId,
    balance: toAmount(balance),
    spendableBalance: toAmount(spendableBalance),
  });

/** The `balance` kind of a synced account: its native coin first, then each of its token accounts. */
export function toAccountBalances(account: Account): AccountAssetBalance[] {
  return [
    toRow(account.currency.id, account),
    ...(account.subAccounts ?? []).map(token => toRow(token.token.id, token)),
  ];
}
