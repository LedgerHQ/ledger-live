import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { CardTransactionDetail } from "./CardTransactionDetail";
import type { CardTransactionDetailProps } from "./CardTransactionDetail.types";

export type CardTransactionDetailDialogProps = CardTransactionDetailProps &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
  }>;

export function CardTransactionDetailDialog({
  isOpen,
  onClose,
  ...detailProps
}: CardTransactionDetailDialogProps) {
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
          <CardTransactionDetail {...detailProps} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
