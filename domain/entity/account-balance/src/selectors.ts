import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountAssetBalance, AccountBalancesState, BalanceAssetId } from "./schema";

export type WithAccountBalances = { accountBalances: AccountBalancesState };

export const selectAccountBalances = (
  state: WithAccountBalances,
  accountUUID: AccountUUID,
): AccountAssetBalance[] | undefined => state.accountBalances[accountUUID];

export const selectAccountAssetBalance = (
  state: WithAccountBalances,
  accountUUID: AccountUUID,
  assetId: BalanceAssetId,
): AccountAssetBalance | undefined =>
  state.accountBalances[accountUUID]?.find(row => row.assetId === assetId);
