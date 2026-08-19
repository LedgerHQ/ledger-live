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

function toOptionalAmountRaw(value: BigNumber | undefined): string | undefined {
  return BigNumber.isBigNumber(value) ? value.toString() : undefined;
}

function toOptionalAmount(value: string | undefined): BigNumber | undefined {
  return typeof value === "string" ? new BigNumber(value) : undefined;
}

function toPositionDetailsRaw(p: StakingPositionDetails): StakingPositionDetailsRaw {
  const activeAmount = toOptionalAmountRaw(p.activeAmount);
  const inactiveAmount = toOptionalAmountRaw(p.inactiveAmount);
  const withdrawableAmount = toOptionalAmountRaw(p.withdrawableAmount);
  const lockedReserve = toOptionalAmountRaw(p.lockedReserve);
  return {
    ...(p.positionId !== undefined ? { positionId: p.positionId } : {}),
    ...(activeAmount !== undefined ? { activeAmount } : {}),
    ...(inactiveAmount !== undefined ? { inactiveAmount } : {}),
    ...(withdrawableAmount !== undefined ? { withdrawableAmount } : {}),
    ...(p.canStake !== undefined ? { canStake: p.canStake } : {}),
    ...(p.canWithdraw !== undefined ? { canWithdraw: p.canWithdraw } : {}),
    ...(lockedReserve !== undefined ? { lockedReserve } : {}),
  };
}

function fromPositionDetailsRaw(p: StakingPositionDetailsRaw): StakingPositionDetails {
  const activeAmount = toOptionalAmount(p.activeAmount);
  const inactiveAmount = toOptionalAmount(p.inactiveAmount);
  const withdrawableAmount = toOptionalAmount(p.withdrawableAmount);
  const lockedReserve = toOptionalAmount(p.lockedReserve);
  return {
    ...(typeof p.positionId === "string" ? { positionId: p.positionId } : {}),
    ...(activeAmount !== undefined ? { activeAmount } : {}),
    ...(inactiveAmount !== undefined ? { inactiveAmount } : {}),
    ...(withdrawableAmount !== undefined ? { withdrawableAmount } : {}),
    ...(typeof p.canStake === "boolean" ? { canStake: p.canStake } : {}),
    ...(typeof p.canWithdraw === "boolean" ? { canWithdraw: p.canWithdraw } : {}),
    ...(lockedReserve !== undefined ? { lockedReserve } : {}),
  };
}

function toStakingDelegationRaw(d: StakingDelegation): StakingDelegationRaw {
  const shares = BigNumber.isBigNumber(d.shares) ? d.shares.toString() : undefined;
  return {
    ...toPositionDetailsRaw(d),
    validatorAddress: d.validatorAddress,
    ...(d.validatorId !== undefined ? { validatorId: d.validatorId } : {}),
    ...(d.validatorName !== undefined ? { validatorName: d.validatorName } : {}),
    amount: d.amount.toString(),
    pendingRewards: d.pendingRewards.toString(),
    status: d.status,
    ...(shares !== undefined ? { shares } : {}),
  };
}

function fromStakingDelegationRaw(d: StakingDelegationRaw): StakingDelegation {
  const shares = typeof d.shares === "string" ? new BigNumber(d.shares) : undefined;
  return {
    ...fromPositionDetailsRaw(d),
    validatorAddress: d.validatorAddress,
    ...(typeof d.validatorId === "string" ? { validatorId: d.validatorId } : {}),
    ...(typeof d.validatorName === "string" ? { validatorName: d.validatorName } : {}),
    amount: new BigNumber(d.amount),
    pendingRewards: new BigNumber(d.pendingRewards),
    status: d.status,
    ...(shares !== undefined ? { shares } : {}),
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
    validatorAddress: u.validatorAddress,
    ...(u.validatorId !== undefined ? { validatorId: u.validatorId } : {}),
    ...(u.validatorName !== undefined ? { validatorName: u.validatorName } : {}),
    amount: u.amount.toString(),
    completionDate: u.completionDate.toISOString(),
    ...(u.withdrawId !== undefined ? { withdrawId: u.withdrawId.toString() } : {}),
    ...(u.status !== undefined ? { status: u.status } : {}),
  };
}

function fromStakingUnbondingRaw(u: StakingUnbondingRaw): StakingUnbonding {
  return {
    ...fromPositionDetailsRaw(u),
    validatorAddress: u.validatorAddress,
    ...(typeof u.validatorId === "string" ? { validatorId: u.validatorId } : {}),
    ...(typeof u.validatorName === "string" ? { validatorName: u.validatorName } : {}),
    amount: new BigNumber(u.amount),
    completionDate: new Date(u.completionDate),
    ...(u.withdrawId !== undefined ? { withdrawId: Number(u.withdrawId) } : {}),
    ...(u.status !== undefined ? { status: u.status } : {}),
  };
}

export function toStakingResourcesRaw(r: StakingResources): StakingResourcesRaw {
  const raw: StakingResourcesRaw = {
    delegations: r.delegations.map(toStakingDelegationRaw),
    redelegations: r.redelegations.map(toStakingRedelegationRaw),
    unbondings: r.unbondings.map(toStakingUnbondingRaw),
    delegatedBalance: r.delegatedBalance.toString(),
    pendingRewardsBalance: r.pendingRewardsBalance.toString(),
    unbondingBalance: r.unbondingBalance.toString(),
  };

  if (r.validators !== undefined) {
    raw.validators = r.validators;
  }

  const actionFeeReserve = toOptionalAmountRaw(r.actionFeeReserve);
  if (actionFeeReserve !== undefined) {
    raw.actionFeeReserve = actionFeeReserve;
  }

  return raw;
}

export function fromStakingResourcesRaw(r: StakingResourcesRaw): StakingResources {
  const resources: StakingResources = {
    delegations: (r.delegations ?? []).map(fromStakingDelegationRaw),
    redelegations: (r.redelegations ?? []).map(fromStakingRedelegationRaw),
    unbondings: (r.unbondings ?? []).map(fromStakingUnbondingRaw),
    delegatedBalance: new BigNumber(r.delegatedBalance ?? "0"),
    pendingRewardsBalance: new BigNumber(r.pendingRewardsBalance ?? "0"),
    unbondingBalance: new BigNumber(r.unbondingBalance ?? "0"),
  };

  if (r.validators !== undefined) {
    resources.validators = r.validators;
  }

  const actionFeeReserve = toOptionalAmount(r.actionFeeReserve);
  if (actionFeeReserve !== undefined) {
    resources.actionFeeReserve = actionFeeReserve;
  }

  return resources;
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
