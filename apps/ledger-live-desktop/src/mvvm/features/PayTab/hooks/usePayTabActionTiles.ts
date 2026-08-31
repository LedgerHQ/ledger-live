import { useMemo } from "react";
import type { ActionTilesProps } from "@features/flow-pay-balance";

export function usePayTabActionTiles(
  onTrackEvent: ActionTilesProps["onTrackEvent"],
  onDeposit: () => void,
  onRequest: () => void,
  onPay: () => void,
): ActionTilesProps {
  return useMemo(
    () => ({
      tiles: [
        { id: "deposit", onPress: onDeposit, appearance: "base" },
        { id: "request", onPress: onRequest, appearance: "transparent" },
        { id: "pay", onPress: onPay, appearance: "transparent" },
      ],
      page: "Pay",
      onTrackEvent,
    }),
    [onTrackEvent, onDeposit, onRequest, onPay],
  );
}
