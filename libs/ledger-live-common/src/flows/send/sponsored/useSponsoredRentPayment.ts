import { useCallback, useEffect, useMemo, useRef } from "react";
import { BigNumber } from "bignumber.js";
import { formatFeeCurrencyAmount } from "../utils/networkFeesDisplay";
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
  locale,
}: Readonly<{
  state: SponsoredState;
  actions: SponsoredSendActions;
  locale: string;
}>): SponsoredRentPayment {
  const { phase, order, rentPayment, paymentTxId } = state;

  // Mounted from Review (IDLE) and again on a retry that cleared the order (RENT_SIGNING).
  const craftInFlightRef = useRef(false);
  useEffect(() => {
    const needsCraft = phase === SPONSORED_PHASE.IDLE || phase === SPONSORED_PHASE.RENT_SIGNING;
    if (!needsCraft || order || craftInFlightRef.current) return;
    craftInFlightRef.current = true;
    actions.craftRent().finally(() => {
      craftInFlightRef.current = false;
    });
  }, [phase, order, actions]);

  const submittedOrderRef = useRef<typeof order>(null);
  const submitSignature = useCallback(
    (combinedSignature: string) => {
      if (!order || submittedOrderRef.current === order) return;
      submittedOrderRef.current = order;
      actions.startRentPayment(combinedSignature, paymentTxId);
    },
    [order, actions, paymentTxId],
  );

  const feeAmountLabel = useMemo(() => {
    const unit = rentPayment?.asset.unit;
    if (!rentPayment || !unit) return null;
    return formatFeeCurrencyAmount(unit, new BigNumber(rentPayment.amount.toString()), locale);
  }, [rentPayment, locale]);

  return { isCrafting: !order, feeAmountLabel, submitSignature };
}
