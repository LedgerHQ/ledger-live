import { recordStakePositionTransaction } from "./stakePositionTransactions.internals";
import type { StakePositionTransaction } from "./types";

/**
 * Records a transaction the user broadcast on a position. For the next minutes, every open of that
 * position reads the backend with `fresh` and polls until the backend shows the transaction. It
 * does not drop the cached positions: `useMarkStakePositionTransacted` does both.
 */
export function markStakePositionTransacted(transaction: StakePositionTransaction): void {
  recordStakePositionTransaction(transaction, Date.now());
}
