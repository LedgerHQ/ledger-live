import React from "react";
import { SwapTransactionStatusDialogView } from "./components/SwapTransactionStatusDialogView";
import { useSwapTransactionStatusDialogViewModel } from "./hooks/useSwapTransactionStatusDialogViewModel";

const SwapTransactionStatusDialog = () => (
  <SwapTransactionStatusDialogView {...useSwapTransactionStatusDialogViewModel()} />
);

export default SwapTransactionStatusDialog;
