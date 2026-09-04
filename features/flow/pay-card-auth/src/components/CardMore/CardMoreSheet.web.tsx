import React, { useCallback, useEffect, useRef } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { CardMoreRow } from "./CardMoreRow";
import type { CardMoreSheetProps } from "./types";

export function CardMoreSheet({ isOpen, title, rows, onClose }: CardMoreSheetProps) {
  const dismissed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    onClose();
  }, [onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleDismiss();
      }
    },
    [handleDismiss],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader density="compact" onClose={handleDismiss} />
        <DialogBody className="flex flex-col" data-testid="card-more-sheet">
          <span className="pb-24 heading-3-semi-bold text-base">{title}</span>

          <div className="-mx-8 flex flex-col" data-testid="card-more-sheet-content">
            {rows.map(row => (
              <CardMoreRow key={row.id} row={row} />
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
