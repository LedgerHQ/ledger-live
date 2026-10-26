import { useEffect, useRef } from "react";
import type { SendFlowTransactionActions } from "../types";

/**
 * The landed energy lowers the standard fee; a copy makes the bridge prepare the transaction again.
 * Only while `active` (the Amount step, not signing): a new transaction mid-signature restarts the
 * device action or drops the broadcast's result. A delivery seen elsewhere waits for Amount.
 */
export function useReestimateOnRentDelivery({
  deliveredAt,
  active,
  updateTransaction,
}: Readonly<{
  deliveredAt: number | null;
  active: boolean;
  updateTransaction: SendFlowTransactionActions["updateTransaction"];
}>): void {
  // Defensive: the flows' updateTransaction is stable, but a new one must not re-fire a delivery.
  const handledRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active || deliveredAt === null || handledRef.current === deliveredAt) return;
    handledRef.current = deliveredAt;
    updateTransaction(transaction => ({ ...transaction }));
  }, [active, deliveredAt, updateTransaction]);
}
