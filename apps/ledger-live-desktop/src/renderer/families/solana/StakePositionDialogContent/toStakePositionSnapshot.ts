import { solanaActivationState } from "@ledgerhq/live-common/families/solana/logic";
import type { SolanaStakingPosition } from "@ledgerhq/live-common/families/solana/types";
import type { StakePositionSnapshot } from "@features/flow-stake-position";

export function toStakePositionSnapshot(position: SolanaStakingPosition): StakePositionSnapshot {
  return {
    state: solanaActivationState(position),
    amount: BigInt(position.amount.toFixed(0)),
    withdrawableAmount: BigInt((position.withdrawableAmount ?? 0).toFixed(0)),
    canStake: position.canStake === true,
    canWithdraw: position.canWithdraw === true,
  };
}
