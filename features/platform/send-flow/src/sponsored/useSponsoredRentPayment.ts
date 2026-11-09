import { useCallback, useEffect, useMemo, useRef } from "react";
import { formatRentPayment } from "./feeAsset";
import { SPONSORED_PHASE, type SponsoredState } from "./types";
import type { SponsoredSendActions } from "./useSponsoredSendOrchestration";

export type SponsoredRentPayment = Readonly<{
  isCrafting: boolean;
  feeAmountLabel: string | null;
  /** Hands a signed TX-A to the provider; a second signature for the same order is dropped. */
  submitSignature: (combinedSignature: string) => void;
}>;

/** The app-agnostic half of the TX-A screen: crafts the order on entry and submits it once. */
export function useSponsoredRentPayment({
  state,
  actions,
  approvedFee,
  locale,
}: Readonly<{
  state: SponsoredState;
  actions: SponsoredSendActions;
  approvedFee: bigint | null;
  locale: string;
}>): SponsoredRentPayment {
  const { phase, order, rentPayment, paymentTxId } = state;

  // Mounted from Review (IDLE) and again on a retry that cleared the order (RENT_SIGNING).
  const craftInFlightRef = useRef(false);
  useEffect(() => {
    const needsCraft = phase === SPONSORED_PHASE.IDLE || phase === SPONSORED_PHASE.RENT_SIGNING;
    if (!needsCraft || order || craftInFlightRef.current) return;
    craftInFlightRef.current = true;
    void actions.craftRent(approvedFee).finally(() => {
      craftInFlightRef.current = false;
    });
  }, [phase, order, actions, approvedFee]);

  const submittedOrderRef = useRef<typeof order>(null);
  const submitSignature = useCallback(
    (combinedSignature: string) => {
      if (!order || submittedOrderRef.current === order) return;
      submittedOrderRef.current = order;
      void actions.startRentPayment(combinedSignature, paymentTxId);
    },
    [order, actions, paymentTxId],
  );

  const feeAmountLabel = useMemo(
    () => (rentPayment ? formatRentPayment(rentPayment, locale) : null),
    [rentPayment, locale],
  );

  return { isCrafting: !order, feeAmountLabel, submitSignature };
}
