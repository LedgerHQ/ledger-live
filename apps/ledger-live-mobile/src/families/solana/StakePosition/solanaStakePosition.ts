import BigNumber from "bignumber.js";
import {
  listSolanaStakingPositions,
  requireStakePositionId,
  solanaActivationState,
} from "@ledgerhq/live-common/families/solana/logic";
import {
  undelegateTransaction,
  withdrawTransaction,
} from "@ledgerhq/live-common/families/solana/transactions";
import type {
  SolanaAccount,
  SolanaStakingPosition,
  Transaction as SolanaTransaction,
} from "@ledgerhq/live-common/families/solana/types";
import type {
  StakePositionCandidate,
  StakePositionExitAction,
  StakePositionSnapshot,
} from "@features/flow-stake-position";

const toBaseUnits = (amount: BigNumber | undefined) =>
  BigInt((amount ?? new BigNumber(0)).toFixed(0));

export const toBigNumber = (baseUnits: bigint) => new BigNumber(baseUnits.toString());

export function toStakePositionSnapshot(position: SolanaStakingPosition): StakePositionSnapshot {
  return {
    state: solanaActivationState(position),
    amount: toBaseUnits(position.amount),
    withdrawableAmount: toBaseUnits(position.withdrawableAmount),
    canStake: position.canStake === true,
    canWithdraw: position.canWithdraw === true,
  };
}

/** Every position of the account, so the request can be checked against all of its validator's. */
export function toStakePositionCandidates(account: SolanaAccount): StakePositionCandidate[] {
  return listSolanaStakingPositions(account.stakingResources).map(position => ({
    positionId: position.positionId ?? "",
    validatorAddress: position.validatorAddress,
  }));
}

/**
 * The exit of a position, built from the account's own data: the live app only names the
 * position, it never sets the stake account or the amount.
 */
export function exitTransactionPatch(
  position: SolanaStakingPosition,
  action: StakePositionExitAction,
): Partial<SolanaTransaction> {
  const stakeAccountAddress = requireStakePositionId(position);
  return action === "deactivate"
    ? { ...undelegateTransaction(stakeAccountAddress), amount: position.amount }
    : withdrawTransaction(stakeAccountAddress, position.withdrawableAmount ?? new BigNumber(0));
}
