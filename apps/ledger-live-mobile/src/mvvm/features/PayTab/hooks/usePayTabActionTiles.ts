import { useMemo } from "react";
import type { ActionTilesProps } from "@features/flow-pay-balance";

export function usePayTabActionTiles(
  onTrackEvent: ActionTilesProps["onTrackEvent"],
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
      onTrackEvent,
    }),
    [onTrackEvent, onDeposit, onRequest],
  );
}
