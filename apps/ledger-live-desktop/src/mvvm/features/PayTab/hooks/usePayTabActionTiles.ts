import { useMemo } from "react";
import type { ActionTilesProps } from "@features/flow-pay-balance";

export function usePayTabActionTiles(
  onDeposit: () => void,
  onRequest: () => void,
  onPay: () => void,
): ActionTilesProps {
  return useMemo(
    () => ({
      tiles: [
        { id: "deposit", onOpenFlow: onDeposit, appearance: "base" },
        { id: "request", onOpenFlow: onRequest, appearance: "transparent" },
        { id: "pay", onOpenFlow: onPay, appearance: "transparent" },
      ],
      page: "Pay",
    }),
    [onDeposit, onRequest, onPay],
  );
}
