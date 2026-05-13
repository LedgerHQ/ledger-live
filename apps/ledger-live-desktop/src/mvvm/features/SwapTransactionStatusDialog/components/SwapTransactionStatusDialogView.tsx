import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useSwapTransactionStatus } from "../hooks/useSwapTransactionStatus";
import { SwapTransactionStatusView } from "./SwapTransactionStatusView";
import type { SwapTransactionStatusDialogViewModel } from "../hooks/useSwapTransactionStatusDialogViewModel";

type SwapTransactionStatusDialogContentProps = Readonly<{
  params: NonNullable<SwapTransactionStatusDialogViewModel["params"]>;
}>;

type SwapTransactionStatusDialogViewProps = Readonly<SwapTransactionStatusDialogViewModel>;

function SwapTransactionStatusDialogContent({ params }: SwapTransactionStatusDialogContentProps) {
  const viewModel = useSwapTransactionStatus(params);

  return <SwapTransactionStatusView params={params} viewModel={viewModel} />;
}

export function SwapTransactionStatusDialogView({
  isOpen,
  params,
  onClose,
  onOpenChange,
}: SwapTransactionStatusDialogViewProps) {
  if (!isOpen || !params) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} height="fit">
      <DialogContent className="max-h-[calc(100vh-32px)] w-[400px] bg-base p-0">
        <DialogHeader density="compact" onClose={onClose} />
        <DialogBody className="flex flex-col px-24 pb-24 gap-24">
          <SwapTransactionStatusDialogContent params={params} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
