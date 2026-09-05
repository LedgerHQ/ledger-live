import React from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useSwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";
import { SwapTransactionStatusView } from "./SwapTransactionStatusView";
import type { SwapTransactionStatusDialogViewModel } from "../hooks/useSwapTransactionStatusDialogViewModel";

type SwapTransactionStatusDialogContentProps = Readonly<{
  params: NonNullable<SwapTransactionStatusDialogViewModel["params"]>;
}>;

type SwapTransactionStatusDialogViewProps = Readonly<SwapTransactionStatusDialogViewModel>;

function SwapTransactionStatusDialogContent({ params }: SwapTransactionStatusDialogContentProps) {
  const viewModel = useSwapTransactionStatusViewModel(params);

  return <SwapTransactionStatusView {...viewModel} origin={params.origin} />;
}

export function SwapTransactionStatusDialogView({
  isOpen,
  params,
  onClose,
  onOpenChange,
}: SwapTransactionStatusDialogViewProps) {
  const { t } = useTranslation();

  if (!isOpen || !params) return null;
  const contentKey = `${params.provider ?? ""}:${params.swapId}`;
  const title = params.origin === "perps" ? t("perpsTransactionStatus.dialogTitle") : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} height="fit">
      <DialogContent
        data-testid="swap-transaction-status-dialog"
        className="max-h-[calc(100vh-16px)] w-[400px] bg-canvas-sheet p-0 pb-24"
      >
        <DialogHeader density="compact" title={title} onClose={onClose} />
        <DialogBody className="flex flex-col px-24 gap-24">
          <SwapTransactionStatusDialogContent key={contentKey} params={params} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
