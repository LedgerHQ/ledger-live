import React from "react";
import { useFeePaymentViewModel } from "./hooks/useFeePaymentViewModel";
import { FeePaymentScreenView } from "./components/FeePaymentScreenView";

/**
 * Floating FEE_PAYMENT selector: Regular (TRX) vs Pay with Tronify. Reached explicitly from the
 * AMOUNT screen's sponsored-fee nudge (never part of SEND_FLOW_STEP_ORDER — see constants.ts).
 * Picking either option records the choice on SponsoredSendContext and returns to AMOUNT.
 */
export function FeePaymentScreen() {
  const { options, disclaimer, onSelect } = useFeePaymentViewModel();

  return <FeePaymentScreenView options={options} disclaimer={disclaimer} onSelect={onSelect} />;
}
