import BigNumber from "bignumber.js";
import {
  requireStakePositionId,
  solanaActivationState,
} from "@ledgerhq/live-common/families/solana/logic";
import {
  undelegateTransaction,
  withdrawTransaction,
} from "@ledgerhq/live-common/families/solana/transactions";
import type {
  SolanaStakingPosition,
  Transaction as SolanaTransaction,
} from "@ledgerhq/live-common/families/solana/types";
import type { StakePositionExitAction, StakePositionSnapshot } from "@features/flow-stake-position";

const toBaseUnits = (amount: BigNumber | undefined) =>
  BigInt((amount ?? new BigNumber(0)).toFixed(0));

/** The chain state of the position, which builds, gates and signs its exit. */
export function toStakePositionSnapshot(position: SolanaStakingPosition): StakePositionSnapshot {
  return {
    state: solanaActivationState(position),
    amount: toBaseUnits(position.amount),
    withdrawableAmount: toBaseUnits(position.withdrawableAmount),
    canStake: position.canStake === true,
    canWithdraw: position.canWithdraw === true,
  };
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
    ? undelegateTransaction(stakeAccountAddress)
    : withdrawTransaction(stakeAccountAddress, position.withdrawableAmount ?? new BigNumber(0));
}
