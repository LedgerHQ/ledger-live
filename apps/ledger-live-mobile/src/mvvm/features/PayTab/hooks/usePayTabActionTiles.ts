import { useMemo } from "react";
import type { ActionTilesProps } from "@features/flow-pay-balance";

export function usePayTabActionTiles(
  onDeposit: () => void,
  onRequest: () => void,
): ActionTilesProps {
  return useMemo(
    () => ({
      tiles: [
        { id: "deposit", onPress: onDeposit },
        { id: "request", onPress: onRequest },
      ],
      page: "Pay",
    }),
    [onDeposit, onRequest],
  );
}
