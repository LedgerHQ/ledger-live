import React from "react";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import { useSwapTransactionStatusViewModel } from "./hooks/useSwapTransactionStatusViewModel";
import { SwapTransactionStatusView } from "./SwapTransactionStatusView";

type SwapTransactionStatusDrawerBodyProps = {
  params: SwapTransactionStatusParams;
  onClose: () => void;
};

export function SwapTransactionStatusDrawerBody({
  params,
  onClose,
}: SwapTransactionStatusDrawerBodyProps) {
  const viewModel = useSwapTransactionStatusViewModel({ params, onClose });

  return <SwapTransactionStatusView params={params} viewModel={viewModel} />;
}
