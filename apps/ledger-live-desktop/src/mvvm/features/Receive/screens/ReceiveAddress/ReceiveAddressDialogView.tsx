import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { ReceiveAddressDialogViewProps } from "./useReceiveAddressDialogViewModel";

/** Empty for now: the address screen fills it (LIVE-40948). */
export function ReceiveAddressDialogView({ isOpen, onClose }: ReceiveAddressDialogViewProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} className="bg-base p-0">
        <DialogHeader density="compact" onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
