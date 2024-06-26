import { BigNumber } from "bignumber.js";
import {
  TronTransactionInfo,
  TronTransactionInfoRaw,
  isTrongridExtraTxInfo,
  isTrongridExtraTxInfoRaw,
  type TronAccount,
  type TronAccountRaw,
  type TronResources,
  type TronResourcesRaw,
  type TrongridExtraTxInfo,
  type TrongridExtraTxInfoRaw,
} from "../types";
import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";

export const toTronResourcesRaw = ({
  frozen,
  unFrozen,
  delegatedFrozen,
  legacyFrozen,
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
  const cacheTransactionInfoById: Record<string, TronTransactionInfoRaw> = {};
  const unFrozenBandwidth = unFrozen?.bandwidth;
  const unFrozenEnergy = unFrozen?.energy;
  const legacyFrozenBandwidth = legacyFrozen?.bandwidth;
  const legacyFrozenEnergy = legacyFrozen?.energy;

  for (const k in cacheTx) {
    const { fee, blockNumber, withdraw_amount, unfreeze_amount } = cacheTx[k];
    cacheTransactionInfoById[k] = [fee, blockNumber, withdraw_amount, unfreeze_amount];
  }

  return {
    frozen: {
      bandwidth: frozenBandwidth
        ? {
            amount: frozenBandwidth.amount.toString(),
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: frozenEnergy.amount.toString(),
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
    unFrozen: {
      bandwidth: unFrozenBandwidth
        ? unFrozenBandwidth.map(entry => {
            return { amount: entry.amount.toString(), expireTime: entry.expireTime.toISOString() };
          })
        : undefined,
      energy: unFrozenEnergy
        ? unFrozenEnergy.map(entry => {
            return { amount: entry.amount.toString(), expireTime: entry.expireTime.toISOString() };
          })
        : undefined,
    },
    legacyFrozen: {
      bandwidth: legacyFrozenBandwidth
        ? {
            amount: legacyFrozenBandwidth.amount.toString(),
            expiredAt: legacyFrozenBandwidth.expiredAt.toISOString(),
          }
        : undefined,
      energy: legacyFrozenEnergy
        ? {
            amount: legacyFrozenEnergy.amount.toString(),
            expiredAt: legacyFrozenEnergy.expiredAt.toISOString(),
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
  unFrozen,
  delegatedFrozen,
  legacyFrozen,
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
  const unFrozenBandwidth = unFrozen?.bandwidth;
  const unFrozenEnergy = unFrozen?.energy;
  const legacyFrozenBandwidth = legacyFrozen?.bandwidth;
  const legacyFrozenEnergy = legacyFrozen?.energy;

  const cacheTransactionInfoById: Record<string, TronTransactionInfo> = {};

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
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: new BigNumber(frozenEnergy.amount),
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
    unFrozen: {
      bandwidth: unFrozenBandwidth
        ? unFrozenBandwidth.map(entry => {
            return { amount: new BigNumber(entry.amount), expireTime: new Date(entry.expireTime) };
          })
        : undefined,
      energy: unFrozenEnergy
        ? unFrozenEnergy.map(entry => {
            return { amount: new BigNumber(entry.amount), expireTime: new Date(entry.expireTime) };
          })
        : undefined,
    },
    legacyFrozen: {
      bandwidth: legacyFrozenBandwidth
        ? {
            amount: new BigNumber(legacyFrozenBandwidth.amount),
            expiredAt: new Date(legacyFrozenBandwidth.expiredAt),
          }
        : undefined,
      energy: legacyFrozenEnergy
        ? {
            amount: new BigNumber(legacyFrozenEnergy.amount),
            expiredAt: new Date(legacyFrozenEnergy.expiredAt),
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

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): TrongridExtraTxInfo {
  const extra: TrongridExtraTxInfo = {};
  if (!isTrongridExtraTxInfoRaw(extraRaw)) {
    return extra;
  }

  if (extraRaw.frozenAmount) {
    extra.frozenAmount = new BigNumber(extraRaw.frozenAmount);
  }

  if (extraRaw.unfreezeAmount) {
    extra.unfreezeAmount = new BigNumber(extraRaw.unfreezeAmount);
  }

  if (extraRaw.votes) {
    extra.votes = extraRaw.votes;
  }

  if (extraRaw.unDelegatedAmount) {
    extra.unDelegatedAmount = new BigNumber(extraRaw.unDelegatedAmount);
  }

  if (extraRaw.receiverAddress) {
    extra.receiverAddress = extraRaw.receiverAddress;
  }

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra): TrongridExtraTxInfoRaw {
  const extraRaw: TrongridExtraTxInfoRaw = {};
  if (!isTrongridExtraTxInfo(extra)) {
    return extraRaw;
  }

  if (extra.frozenAmount) {
    extraRaw.frozenAmount = extra.frozenAmount.toString();
  }

  if (extra.unfreezeAmount) {
    extraRaw.unfreezeAmount = extra.unfreezeAmount.toString();
  }

  if (extra.votes) {
    extraRaw.votes = extra.votes;
  }

  if (extra.unDelegatedAmount) {
    extraRaw.unDelegatedAmount = extra.unDelegatedAmount.toString();
  }

  if (extra.receiverAddress) {
    extraRaw.receiverAddress = extra.receiverAddress;
  }

  return extraRaw;
}
