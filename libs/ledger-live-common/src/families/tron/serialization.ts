import { BigNumber } from "bignumber.js";
import type { TronAccount, TronAccountRaw, TronResources, TronResourcesRaw } from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";

export const toTronResourcesRaw = ({
  frozen,
  frozenV2,
  unFrozenV2,
  delegatedFrozen,
  delegatedFrozenV2,
  votes,
  tronPower,
  energy,
  bandwidth,
  unwithdrawnReward,
  lastWithdrawnRewardDate,
  lastVotedDate,
  cacheTransactionInfoById: cacheTx,
}: TronResources): TronResourcesRaw => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const cacheTransactionInfoById = {};
  const frozenV2Bandwidth = frozenV2.bandwidth;
  const frozenV2Energy = frozenV2.energy;
  const delegatedFrozenV2Bandwidth = delegatedFrozenV2.bandwidth;
  const delegatedFrozenV2Energy = delegatedFrozenV2.energy;

  for (const k in cacheTx) {
    const { fee, blockNumber, withdraw_amount, unfreeze_amount } = cacheTx[k];
    cacheTransactionInfoById[k] = [fee, blockNumber, withdraw_amount, unfreeze_amount];
  }

  return {
    frozen: {
      bandwidth: frozenBandwidth
        ? {
            amount: frozenBandwidth.amount.toString(),
            expiredAt: frozenBandwidth.expiredAt.toISOString(),
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: frozenEnergy.amount.toString(),
            expiredAt: frozenEnergy.expiredAt.toISOString(),
          }
        : undefined,
    },
    delegatedFrozen: {
      bandwidth: delegatedFrozenBandwidth
        ? {
            amount: delegatedFrozenBandwidth.amount.toString(),
          }
        : undefined,
      energy: delegatedFrozenEnergy
        ? {
            amount: delegatedFrozenEnergy.amount.toString(),
          }
        : undefined,
    },
    frozenV2: {
      bandwidth: frozenV2Bandwidth
        ? {
            amount: frozenV2Bandwidth.amount.toString(),
          }
        : undefined,
      energy: frozenV2Energy
        ? {
            amount: frozenV2Energy.amount.toString(),
          }
        : undefined,
    },
    unFrozenV2: {
      bandwidth: unFrozenV2.bandwidth
        ? unFrozenV2.bandwidth.map(entry => {
            return { amount: entry.amount.toString(), expireTime: entry.expireTime };
          })
        : undefined,
      energy: unFrozenV2.energy
        ? unFrozenV2.energy.map(entry => {
            return { amount: entry.amount.toString(), expireTime: entry.expireTime };
          })
        : undefined,
    },
    delegatedFrozenV2: {
      bandwidth: delegatedFrozenV2Bandwidth
        ? {
            amount: delegatedFrozenV2Bandwidth.amount.toString(),
          }
        : undefined,
      energy: delegatedFrozenV2Energy
        ? {
            amount: delegatedFrozenV2Energy.amount.toString(),
          }
        : undefined,
    },
    votes,
    tronPower,
    energy: energy.toString(),
    bandwidth: {
      freeUsed: bandwidth.freeUsed.toString(),
      freeLimit: bandwidth.freeLimit.toString(),
      gainedUsed: bandwidth.gainedUsed.toString(),
      gainedLimit: bandwidth.gainedLimit.toString(),
    },
    unwithdrawnReward: unwithdrawnReward.toString(),
    lastWithdrawnRewardDate: lastWithdrawnRewardDate
      ? lastWithdrawnRewardDate.toISOString()
      : undefined,
    lastVotedDate: lastVotedDate ? lastVotedDate.toISOString() : undefined,
    cacheTransactionInfoById,
  };
};
export const fromTronResourcesRaw = ({
  frozen,
  frozenV2,
  unFrozenV2,
  delegatedFrozen,
  delegatedFrozenV2,
  votes,
  tronPower,
  energy,
  bandwidth,
  unwithdrawnReward,
  lastWithdrawnRewardDate,
  lastVotedDate,
  cacheTransactionInfoById: cacheTransactionInfoByIdRaw,
}: TronResourcesRaw): TronResources => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const cacheTransactionInfoById = {};
  const frozenV2Bandwidth = frozenV2.bandwidth;
  const frozenV2Energy = frozenV2.energy;
  const delegatedFrozenV2Bandwidth = delegatedFrozenV2.bandwidth;
  const delegatedFrozenV2Energy = delegatedFrozenV2.energy;

  if (cacheTransactionInfoByIdRaw) {
    for (const k in cacheTransactionInfoByIdRaw) {
      const [fee, blockNumber, withdraw_amount, unfreeze_amount] = cacheTransactionInfoByIdRaw[k];
      cacheTransactionInfoById[k] = {
        fee,
        blockNumber,
        withdraw_amount,
        unfreeze_amount,
      };
    }
  }

  return {
    frozen: {
      bandwidth: frozenBandwidth
        ? {
            amount: new BigNumber(frozenBandwidth.amount),
            expiredAt: new Date(frozenBandwidth.expiredAt),
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: new BigNumber(frozenEnergy.amount),
            expiredAt: new Date(frozenEnergy.expiredAt),
          }
        : undefined,
    },
    delegatedFrozen: {
      bandwidth: delegatedFrozenBandwidth
        ? {
            amount: new BigNumber(delegatedFrozenBandwidth.amount),
          }
        : undefined,
      energy: delegatedFrozenEnergy
        ? {
            amount: new BigNumber(delegatedFrozenEnergy.amount),
          }
        : undefined,
    },
    frozenV2: {
      bandwidth: frozenV2Bandwidth
        ? {
            amount: new BigNumber(frozenV2Bandwidth.amount),
          }
        : undefined,
      energy: frozenV2Energy
        ? {
            amount: new BigNumber(frozenV2Energy.amount),
          }
        : undefined,
    },
    unFrozenV2: {
      bandwidth: unFrozenV2.bandwidth
        ? unFrozenV2.bandwidth.map(entry => {
            return { amount: new BigNumber(entry.amount), expireTime: entry.expireTime };
          })
        : undefined,
      energy: unFrozenV2.energy
        ? unFrozenV2.energy.map(entry => {
            return { amount: new BigNumber(entry.amount), expireTime: entry.expireTime };
          })
        : undefined,
    },
    delegatedFrozenV2: {
      bandwidth: delegatedFrozenV2Bandwidth
        ? {
            amount: new BigNumber(delegatedFrozenV2Bandwidth.amount),
          }
        : undefined,
      energy: delegatedFrozenV2Energy
        ? {
            amount: new BigNumber(delegatedFrozenV2Energy.amount),
          }
        : undefined,
    },
    votes,
    tronPower,
    energy: new BigNumber(energy),
    bandwidth: {
      freeUsed: new BigNumber(bandwidth.freeUsed),
      freeLimit: new BigNumber(bandwidth.freeLimit),
      gainedUsed: new BigNumber(bandwidth.gainedUsed),
      gainedLimit: new BigNumber(bandwidth.gainedLimit),
    },
    unwithdrawnReward: new BigNumber(unwithdrawnReward),
    lastWithdrawnRewardDate: lastWithdrawnRewardDate
      ? new Date(lastWithdrawnRewardDate)
      : undefined,
    lastVotedDate: lastVotedDate ? new Date(lastVotedDate) : undefined,
    cacheTransactionInfoById,
  };
};

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const tronAccount = account as TronAccount;
  if (tronAccount.tronResources) {
    (accountRaw as TronAccountRaw).tronResources = toTronResourcesRaw(tronAccount.tronResources);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const tronResourcesRaw = (accountRaw as TronAccountRaw).tronResources;
  if (tronResourcesRaw)
    (account as TronAccount).tronResources = fromTronResourcesRaw(tronResourcesRaw);
}
