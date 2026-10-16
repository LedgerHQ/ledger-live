import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";

/** The synced account's native balance first, then one row per token account; spendable floors at 0. */
export function toAccountBalances(account: Account): AccountAssetBalance[] {
  return [
    { assetId: account.currency.id, balance: account.balance, spendable: account.spendableBalance },
    ...(account.subAccounts ?? []).map(token => ({
      assetId: token.token.id,
      balance: token.balance,
      spendable: token.spendableBalance,
    })),
  ].map(({ assetId, balance, spendable }) =>
    AccountAssetBalanceSchema.parse({
      assetId,
      balance: balance.toFixed(),
      spendableBalance: BigNumber.max(spendable, 0).toFixed(),
    }),
  );
}
