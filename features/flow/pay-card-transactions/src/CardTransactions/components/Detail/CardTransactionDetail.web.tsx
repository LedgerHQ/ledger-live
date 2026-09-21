import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { CardTransactionDetailView } from "./CardTransactionDetailView";
import { useCardTransactionDetailViewModel } from "./useCardTransactionDetailViewModel";
import type { CardTransactionDetailProps } from "./types";

type CardTransactionDetailDialogProps = CardTransactionDetailProps &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
  }>;

export function CardTransactionDetail({
  isOpen,
  onClose,
  ...detailProps
}: CardTransactionDetailDialogProps) {
  const viewModel = useCardTransactionDetailViewModel(detailProps);
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} height="fit">
      <DialogContent
        className="max-h-[calc(100vh-16px)] bg-canvas-sheet p-0"
        data-testid="card-transaction-detail-dialog"
        aria-describedby={undefined}
      >
        <DialogHeader density="compact" onClose={onClose} />
        <DialogBody className="overflow-y-auto">
          <CardTransactionDetailView {...viewModel} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
