import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  StakingAccount,
  StakingAccountRaw,
  StakingDelegation,
  StakingDelegationRaw,
  StakingPositionDetails,
  StakingPositionDetailsRaw,
  StakingRedelegation,
  StakingRedelegationRaw,
  StakingResources,
  StakingResourcesRaw,
  StakingUnbonding,
  StakingUnbondingRaw,
} from "@ledgerhq/types-live";

/**
 * This package compiles with `exactOptionalPropertyTypes`, so an absent optional field has to be
 * left out of the object entirely rather than set to `undefined`. Key absence is also part of the
 * contract downstream: coin-solana discriminates its position union on `"pendingRewards" in
 * position`.
 */
function definedOnly<T extends object>(
  fields: T,
): Partial<{ [K in keyof T]-?: Exclude<T[K], undefined> }> {
  const defined: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      defined[key] = value;
    }
  }
  return defined as Partial<{ [K in keyof T]-?: Exclude<T[K], undefined> }>;
}

function toAmountRaw(value: BigNumber | undefined): string | undefined {
  return BigNumber.isBigNumber(value) ? value.toString() : undefined;
}

function fromAmountRaw(value: string | undefined): BigNumber | undefined {
  return typeof value === "string" ? new BigNumber(value) : undefined;
}

function asString(value: string | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: boolean | undefined): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: string | undefined): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPositionDetailsRaw(p: StakingPositionDetails): StakingPositionDetailsRaw {
  return definedOnly({
    positionId: p.positionId,
    activeAmount: toAmountRaw(p.activeAmount),
    inactiveAmount: toAmountRaw(p.inactiveAmount),
    withdrawableAmount: toAmountRaw(p.withdrawableAmount),
    canStake: p.canStake,
    canWithdraw: p.canWithdraw,
    lockedReserve: toAmountRaw(p.lockedReserve),
  });
}

function fromPositionDetailsRaw(p: StakingPositionDetailsRaw): StakingPositionDetails {
  return definedOnly({
    positionId: asString(p.positionId),
    activeAmount: fromAmountRaw(p.activeAmount),
    inactiveAmount: fromAmountRaw(p.inactiveAmount),
    withdrawableAmount: fromAmountRaw(p.withdrawableAmount),
    canStake: asBoolean(p.canStake),
    canWithdraw: asBoolean(p.canWithdraw),
    lockedReserve: fromAmountRaw(p.lockedReserve),
  });
}

function toStakingDelegationRaw(d: StakingDelegation): StakingDelegationRaw {
  return {
    ...toPositionDetailsRaw(d),
    ...definedOnly({
      validatorId: d.validatorId,
      validatorName: d.validatorName,
      shares: toAmountRaw(d.shares),
    }),
    validatorAddress: d.validatorAddress,
    amount: d.amount.toString(),
    pendingRewards: d.pendingRewards.toString(),
    status: d.status,
  };
}

function fromStakingDelegationRaw(d: StakingDelegationRaw): StakingDelegation {
  return {
    ...fromPositionDetailsRaw(d),
    ...definedOnly({
      validatorId: asString(d.validatorId),
      validatorName: asString(d.validatorName),
      shares: fromAmountRaw(d.shares),
    }),
    validatorAddress: d.validatorAddress,
    amount: new BigNumber(d.amount),
    pendingRewards: new BigNumber(d.pendingRewards),
    status: d.status,
  };
}

function toStakingRedelegationRaw(r: StakingRedelegation): StakingRedelegationRaw {
  return {
    validatorSrcAddress: r.validatorSrcAddress,
    validatorDstAddress: r.validatorDstAddress,
    amount: r.amount.toString(),
    completionDate: r.completionDate.toISOString(),
  };
}

function fromStakingRedelegationRaw(r: StakingRedelegationRaw): StakingRedelegation {
  return {
    validatorSrcAddress: r.validatorSrcAddress,
    validatorDstAddress: r.validatorDstAddress,
    amount: new BigNumber(r.amount),
    completionDate: new Date(r.completionDate),
  };
}

function toStakingUnbondingRaw(u: StakingUnbonding): StakingUnbondingRaw {
  return {
    ...toPositionDetailsRaw(u),
    ...definedOnly({
      validatorId: u.validatorId,
      validatorName: u.validatorName,
      withdrawId: u.withdrawId?.toString(),
      status: u.status,
    }),
    validatorAddress: u.validatorAddress,
    amount: u.amount.toString(),
    completionDate: u.completionDate.toISOString(),
  };
}

function fromStakingUnbondingRaw(u: StakingUnbondingRaw): StakingUnbonding {
  return {
    ...fromPositionDetailsRaw(u),
    ...definedOnly({
      validatorId: asString(u.validatorId),
      validatorName: asString(u.validatorName),
      withdrawId: asNumber(u.withdrawId),
      status: u.status,
    }),
    validatorAddress: u.validatorAddress,
    amount: new BigNumber(u.amount),
    completionDate: new Date(u.completionDate),
  };
}

export function toStakingResourcesRaw(r: StakingResources): StakingResourcesRaw {
  return {
    ...definedOnly({
      validators: r.validators,
      actionFeeReserve: toAmountRaw(r.actionFeeReserve),
    }),
    delegations: r.delegations.map(toStakingDelegationRaw),
    redelegations: r.redelegations.map(toStakingRedelegationRaw),
    unbondings: r.unbondings.map(toStakingUnbondingRaw),
    delegatedBalance: r.delegatedBalance.toString(),
    pendingRewardsBalance: r.pendingRewardsBalance.toString(),
    unbondingBalance: r.unbondingBalance.toString(),
  };
}

export function fromStakingResourcesRaw(r: StakingResourcesRaw): StakingResources {
  return {
    ...definedOnly({
      validators: r.validators,
      actionFeeReserve: fromAmountRaw(r.actionFeeReserve),
    }),
    delegations: (r.delegations ?? []).map(fromStakingDelegationRaw),
    redelegations: (r.redelegations ?? []).map(fromStakingRedelegationRaw),
    unbondings: (r.unbondings ?? []).map(fromStakingUnbondingRaw),
    delegatedBalance: new BigNumber(r.delegatedBalance ?? "0"),
    pendingRewardsBalance: new BigNumber(r.pendingRewardsBalance ?? "0"),
    unbondingBalance: new BigNumber(r.unbondingBalance ?? "0"),
  };
}

export function assignStakingResourcesToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const stakingAccount = account as StakingAccount;
  if (stakingAccount.stakingResources) {
    (accountRaw as StakingAccountRaw).stakingResources = toStakingResourcesRaw(
      stakingAccount.stakingResources,
    );
  }
}

export function assignStakingResourcesFromAccountRaw(
  accountRaw: AccountRaw,
  account: Account,
): void {
  const stakingResourcesRaw = (accountRaw as StakingAccountRaw).stakingResources;
  if (stakingResourcesRaw) {
    (account as StakingAccount).stakingResources = fromStakingResourcesRaw(stakingResourcesRaw);
  }
}
