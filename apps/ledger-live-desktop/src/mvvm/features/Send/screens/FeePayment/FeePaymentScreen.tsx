import React from "react";
import { useFeePaymentViewModel } from "./hooks/useFeePaymentViewModel";
import { FeePaymentScreenView } from "./components/FeePaymentScreenView";

export function FeePaymentScreen() {
  const viewModel = useFeePaymentViewModel();

  return <FeePaymentScreenView {...viewModel} />;
}
