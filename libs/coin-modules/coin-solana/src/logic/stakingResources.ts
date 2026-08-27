import type { StakingDelegation, StakingResources, StakingUnbonding } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { SolanaAccount, SolanaStake, SolanaStakingPosition, StakeAction } from "../types";
import { assertUnreachable } from "../utils";

export function emptyStakingResources(actionFeeReserve?: BigNumber): StakingResources {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber(0),
    pendingRewardsBalance: new BigNumber(0),
    unbondingBalance: new BigNumber(0),
    ...(actionFeeReserve !== undefined ? { actionFeeReserve } : {}),
  };
}

function isSolanaDelegation(position: SolanaStakingPosition): position is StakingDelegation {
  return "pendingRewards" in position;
}

const ZERO = new BigNumber(0);

export function listSolanaStakingPositions(
  resources: StakingResources | undefined,
): SolanaStakingPosition[] {
  if (!resources) return [];
  return [...resources.delegations, ...resources.unbondings].sort(
    (a, b) =>
      b.amount.comparedTo(a.amount) ||
      (b.withdrawableAmount ?? ZERO).comparedTo(a.withdrawableAmount ?? ZERO) ||
      0,
  );
}

/**
 * `positionId` is optional on the generic staking types, but on Solana it always carries the stake
 * account address. Fail loudly rather than letting a transaction be built against an empty address.
 */
export function requireStakePositionId(position: SolanaStakingPosition): string {
  const { positionId } = position;
  if (!positionId) {
    throw new Error("solana: staking position is missing its stake account address");
  }
  return positionId;
}

export function findSolanaStakingPosition(
  account: SolanaAccount,
  positionId: string,
): SolanaStakingPosition | undefined {
  return listSolanaStakingPositions(account.stakingResources).find(
    position => position.positionId === positionId,
  );
}

export function solanaActivationState(
  position: SolanaStakingPosition,
): SolanaStake["activation"]["state"] {
  if (isSolanaDelegation(position)) {
    const status = position.status;
    switch (status) {
      case "activating":
        return "activating";
      case "bonded":
        return "active";
      // Solana never emits these two on a delegation, but other chains do: map them to the
      // equivalent Solana state rather than silently reporting the stake as active
      case "unbonding":
        return "deactivating";
      case "unbonded":
        return "inactive";
      default:
        return assertUnreachable(status);
    }
  }
  const status = position.status;
  switch (status) {
    case "withdrawable":
      return "inactive";
    // status is optional on the generic type; an unbonding without one is still deactivating
    case "deactivating":
    case undefined:
      return "deactivating";
    default:
      return assertUnreachable(status);
  }
}

export function solanaStakesToStakingResources(
  stakes: SolanaStake[],
  unstakeReserve: BigNumber,
): StakingResources {
  const delegations: StakingDelegation[] = [];
  const unbondings: StakingUnbonding[] = [];

  for (const stake of stakes) {
    const extras = {
      positionId: stake.stakeAccAddr,
      validatorAddress: stake.delegation?.voteAccAddr ?? "",
      amount: new BigNumber(stake.delegation?.stake ?? 0),
      activeAmount: new BigNumber(stake.activation.active),
      inactiveAmount: new BigNumber(stake.activation.inactive),
      withdrawableAmount: new BigNumber(stake.withdrawable),
      canStake: stake.hasStakeAuth,
      canWithdraw: stake.hasWithdrawAuth,
      lockedReserve: new BigNumber(stake.rentExemptReserve),
    };

    switch (stake.activation.state) {
      case "active":
      case "activating":
        delegations.push({
          ...extras,
          pendingRewards: new BigNumber(stake.reward?.amount ?? 0),
          status: stake.activation.state === "activating" ? "activating" : "bonded",
        });
        break;
      case "deactivating":
      case "inactive":
        unbondings.push({
          ...extras,
          completionDate: new Date(0),
          status: stake.activation.state === "inactive" ? "withdrawable" : "deactivating",
        });
        break;
      default:
        assertUnreachable(stake.activation.state);
    }
  }

  return {
    delegations,
    redelegations: [],
    unbondings,
    delegatedBalance: delegations.reduce((sum, d) => sum.plus(d.amount), new BigNumber(0)),
    pendingRewardsBalance: delegations.reduce(
      (sum, d) => sum.plus(d.pendingRewards),
      new BigNumber(0),
    ),
    unbondingBalance: unbondings.reduce((sum, u) => sum.plus(u.amount), new BigNumber(0)),
    actionFeeReserve: unstakeReserve,
  };
}

export function stakeActions(position: SolanaStakingPosition): StakeAction[] {
  if (!position.positionId) return [];

  const actions: StakeAction[] = [];

  if ((position.withdrawableAmount ?? new BigNumber(0)).gt(0)) {
    actions.push("withdraw");
  }

  const state = solanaActivationState(position);
  switch (state) {
    case "active":
    case "activating":
      actions.push("deactivate");
      break;
    case "deactivating":
      actions.push("reactivate");
      break;
    case "inactive":
      actions.push("activate");
      break;
    default:
      return assertUnreachable(state);
  }

  return actions;
}

export function stakeActivePercent(position: SolanaStakingPosition): number {
  if (position.amount.isZero()) {
    return 0;
  }
  return (position.activeAmount ?? new BigNumber(0)).div(position.amount).times(100).toNumber();
}
