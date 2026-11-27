import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { AccountUUID } from "@domain/entity-account";
import type { AccountAssetBalance, AccountBalancesState } from "./schema";

export type WithAccountBalances = { accountBalances: AccountBalancesState };

export const selectAccountBalances = (
  state: WithAccountBalances,
  accountUUID: AccountUUID,
): AccountAssetBalance[] | undefined => state.accountBalances[accountUUID];

export const selectAccountAssetBalance = (
  state: WithAccountBalances,
  accountUUID: AccountUUID,
  assetId: CryptoOrTokenCurrencyId,
): AccountAssetBalance | undefined =>
  state.accountBalances[accountUUID]?.find(row => row.assetId === assetId);
