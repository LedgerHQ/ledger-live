import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useSwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";
import { SwapTransactionStatusView } from "./SwapTransactionStatusView";
import type { SwapTransactionStatusDialogViewModel } from "../hooks/useSwapTransactionStatusDialogViewModel";

type SwapTransactionStatusDialogContentProps = Readonly<{
  params: NonNullable<SwapTransactionStatusDialogViewModel["params"]>;
  returnAction: SwapTransactionStatusDialogViewModel["returnAction"];
}>;

type SwapTransactionStatusDialogViewProps = Readonly<SwapTransactionStatusDialogViewModel>;

function SwapTransactionStatusDialogContent({
  params,
  returnAction,
}: SwapTransactionStatusDialogContentProps) {
  const viewModel = useSwapTransactionStatusViewModel(params);

  return (
    <SwapTransactionStatusView {...viewModel} origin={params.origin} returnAction={returnAction} />
  );
}

export function SwapTransactionStatusDialogView({
  isOpen,
  params,
  title,
  returnAction,
  onClose,
  onOpenChange,
}: SwapTransactionStatusDialogViewProps) {
  if (!isOpen || !params) return null;
  const contentKey = `${params.provider ?? ""}:${params.swapId}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} height="fit">
      <DialogContent
        data-testid="swap-transaction-status-dialog"
        className="max-h-[calc(100vh-16px)] w-[400px] bg-canvas-sheet p-0 pb-24"
      >
        <DialogHeader density="compact" title={title} onClose={onClose} />
        <DialogBody className="flex flex-col px-24 gap-24">
          <SwapTransactionStatusDialogContent
            key={contentKey}
            params={params}
            returnAction={returnAction}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
