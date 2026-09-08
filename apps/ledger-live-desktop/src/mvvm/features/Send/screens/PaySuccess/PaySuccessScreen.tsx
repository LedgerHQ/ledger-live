import React from "react";
import { PaySuccess } from "@features/flow-pay-contact";
import { usePaySuccessViewModel } from "./hooks/usePaySuccessViewModel";

export function PaySuccessScreen() {
  const viewModel = usePaySuccessViewModel();

  return <PaySuccess {...viewModel} />;
}
