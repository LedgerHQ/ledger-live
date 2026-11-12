import { Account, AccountRaw } from "@ledgerhq/types-live";
import { fromRawBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import type { NearAccount, NearAccountRaw, NearResources, NearResourcesRaw } from "./types";

export function toNearResourcesRaw(r: NearResources): NearResourcesRaw {
  const { stakedBalance, pendingBalance, availableBalance, storageUsageBalance, stakingPositions } =
    r;
  return {
    stakedBalance: stakedBalance.toString(),
    pendingBalance: pendingBalance.toString(),
    availableBalance: availableBalance.toString(),
    storageUsageBalance: storageUsageBalance.toString(),
    stakingPositions: stakingPositions.map(({ staked, validatorId, available, pending }) => ({
      staked: staked.toString(),
      available: available.toString(),
      pending: pending.toString(),
      validatorId,
    })),
  };
}

export function fromNearResourcesRaw(r: NearResourcesRaw): NearResources {
  const {
    stakedBalance,
    pendingBalance,
    availableBalance,
    storageUsageBalance,
    stakingPositions = [],
  } = r;
  return {
    stakedBalance: fromRawBigNumber(stakedBalance),
    pendingBalance: fromRawBigNumber(pendingBalance),
    availableBalance: fromRawBigNumber(availableBalance),
    storageUsageBalance: fromRawBigNumber(storageUsageBalance),
    stakingPositions: stakingPositions.map(({ staked, validatorId, available, pending }) => ({
      staked: fromRawBigNumber(staked),
      available: fromRawBigNumber(available),
      pending: fromRawBigNumber(pending),
      validatorId,
    })),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const nearAccount = account as NearAccount;
  if (nearAccount.nearResources) {
    (accountRaw as NearAccountRaw).nearResources = toNearResourcesRaw(nearAccount.nearResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const nearResourcesRaw = (accountRaw as NearAccountRaw).nearResources;
  if (nearResourcesRaw)
    (account as NearAccount).nearResources = fromNearResourcesRaw(nearResourcesRaw);
}
