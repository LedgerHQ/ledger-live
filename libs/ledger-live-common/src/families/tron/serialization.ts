import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  type TronAccount,
  type TronAccountRaw,
  type TronResources,
  type TronResourcesRaw,
  type TrongridExtraTxInfo,
  type TrongridExtraTxInfoRaw,
} from "./types";

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
}: TronResources): TronResourcesRaw => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const unFrozenBandwidth = unFrozen?.bandwidth;
  const unFrozenEnergy = unFrozen?.energy;
  const legacyFrozenBandwidth = legacyFrozen?.bandwidth;
  const legacyFrozenEnergy = legacyFrozen?.energy;

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
}: TronResourcesRaw): TronResources => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const unFrozenBandwidth = unFrozen?.bandwidth;
  const unFrozenEnergy = unFrozen?.energy;
  const legacyFrozenBandwidth = legacyFrozen?.bandwidth;
  const legacyFrozenEnergy = legacyFrozen?.energy;

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

/**
 * The staking amounts are `BigNumber`s on the operation (what the app renderers consume) and strings
 * once persisted. Every other key of `extra` is carried through untouched, so wiring these hooks
 * costs the rest of the bag nothing.
 *
 * Each amount is converted whenever it is present, rather than gated behind a whole-bag type guard:
 * a guard keyed on `frozenAmount`/`unfreezeAmount`/`votes` rejects an undelegate's extras, which
 * would then take the verbatim branch and persist a `BigNumber` as `{s,e,c}` for the renderers to
 * choke on.
 */
export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  if (extraRaw === null || typeof extraRaw !== "object") return extraRaw;
  const { frozenAmount, unfreezeAmount, unDelegatedAmount, ...rest } =
    extraRaw as TrongridExtraTxInfoRaw;

  return {
    ...rest,
    ...(frozenAmount !== undefined ? { frozenAmount: new BigNumber(frozenAmount) } : {}),
    ...(unfreezeAmount !== undefined ? { unfreezeAmount: new BigNumber(unfreezeAmount) } : {}),
    ...(unDelegatedAmount !== undefined
      ? { unDelegatedAmount: new BigNumber(unDelegatedAmount) }
      : {}),
  } satisfies TrongridExtraTxInfo;
}

export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  if (extra === null || typeof extra !== "object") return extra;
  const { frozenAmount, unfreezeAmount, unDelegatedAmount, ...rest } = extra as TrongridExtraTxInfo;

  return {
    ...rest,
    ...(frozenAmount !== undefined ? { frozenAmount: frozenAmount.toString() } : {}),
    ...(unfreezeAmount !== undefined ? { unfreezeAmount: unfreezeAmount.toString() } : {}),
    ...(unDelegatedAmount !== undefined ? { unDelegatedAmount: unDelegatedAmount.toString() } : {}),
  } satisfies TrongridExtraTxInfoRaw;
}
