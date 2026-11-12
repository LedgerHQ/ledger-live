import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { AccountStatus, AccountStatusState, AssetStatus } from "./schema";

export type WithAccountStatus = { accountStatus: AccountStatusState };

export const selectAccountStatus = (
  state: WithAccountStatus,
  accountUUID: AccountUUID,
): AccountStatus | undefined => state.accountStatus[accountUUID]?.account?.status;

export const selectAssetStatus = (
  state: WithAccountStatus,
  accountUUID: AccountUUID,
  assetId: CryptoOrTokenCurrencyId,
): AssetStatus | undefined => state.accountStatus[accountUUID]?.assets[assetId]?.status;
