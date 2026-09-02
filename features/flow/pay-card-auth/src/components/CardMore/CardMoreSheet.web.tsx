import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { CardMoreRow } from "./CardMoreRow";
import type { CardMoreSheetProps } from "./types";

export function CardMoreSheet({ isOpen, title, rows, onClose }: CardMoreSheetProps) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        {/* No `title` here: the design wants it left-aligned and larger, below the header. */}
        <DialogHeader density="compact" onClose={onClose} />
        {/*
          `DialogBody` keeps its own `px-24`, so the title sits level with the close button in the
          header. The rows pull back by 8, and a row's own padding of 8 then puts its icon at 24 too.
          `DialogContent` already ships the bottom inset the design asks for.
        */}
        <DialogBody className="flex flex-col" data-testid="card-more-sheet">
          {/* The 24 below the title is the whole gap to the first row. */}
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
