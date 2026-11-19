import { useCallback } from "react";
import { useRefreshEarnPositions } from "@domain/api-earn-positions";
import { markStakePositionTransacted } from "../stakePositionTransactions";
import type { StakePositionTransaction } from "../types";

/**
 * Call it once the user's own transaction is broadcast: it drops the cached positions of the
 * address, and the next opens of the position poll until the backend shows the transaction.
 */
export function useMarkStakePositionTransacted(): (transaction: StakePositionTransaction) => void {
  const refreshEarnPositions = useRefreshEarnPositions();

  return useCallback(
    transaction => {
      markStakePositionTransacted(transaction);
      refreshEarnPositions(transaction.ownerAddress);
    },
    [refreshEarnPositions],
  );
}
