import { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { NearAccount, NearAccountRaw, NearResources, NearResourcesRaw } from "./types";

export function toNearResourcesRaw(r: NearResources): NearResourcesRaw {
  const {
    stakedBalance,
    pendingBalance,
    availableBalance,
    storageUsageBalance,
    stakingPositions,
    accountStateFingerprint,
    historyRecheckSince,
    historyRecheckFingerprint,
    historyConfirmPending,
    poolListingPending,
    pendingCandidatePools,
  } = r;
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
    ...(accountStateFingerprint !== undefined && { accountStateFingerprint }),
    ...(historyRecheckSince !== undefined && { historyRecheckSince }),
    ...(historyRecheckFingerprint !== undefined && { historyRecheckFingerprint }),
    ...(historyConfirmPending !== undefined && { historyConfirmPending }),
    ...(poolListingPending !== undefined && { poolListingPending }),
    ...(pendingCandidatePools !== undefined && {
      pendingCandidatePools: [...pendingCandidatePools],
    }),
  };
}

export function fromNearResourcesRaw(r: NearResourcesRaw): NearResources {
  const {
    stakedBalance,
    pendingBalance,
    availableBalance,
    storageUsageBalance,
    stakingPositions = [],
    accountStateFingerprint,
    historyRecheckSince,
    historyRecheckFingerprint,
    historyConfirmPending,
    poolListingPending,
    pendingCandidatePools,
  } = r;
  return {
    stakedBalance: new BigNumber(stakedBalance),
    pendingBalance: new BigNumber(pendingBalance),
    availableBalance: new BigNumber(availableBalance),
    storageUsageBalance: new BigNumber(storageUsageBalance),
    stakingPositions: stakingPositions.map(({ staked, validatorId, available, pending }) => ({
      staked: new BigNumber(staked),
      available: new BigNumber(available),
      pending: new BigNumber(pending),
      validatorId,
    })),
    ...(accountStateFingerprint !== undefined && { accountStateFingerprint }),
    ...(historyRecheckSince !== undefined && { historyRecheckSince }),
    ...(historyRecheckFingerprint !== undefined && { historyRecheckFingerprint }),
    ...(historyConfirmPending !== undefined && { historyConfirmPending }),
    ...(poolListingPending !== undefined && { poolListingPending }),
    ...(pendingCandidatePools !== undefined && {
      pendingCandidatePools: [...pendingCandidatePools],
    }),
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
