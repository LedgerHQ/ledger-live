import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView({ onClose }: ReceiveAddressViewProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        aria-describedby={undefined}
        className="bg-base p-0"
        data-testid="receive-address"
      >
        <DialogHeader density="compact" onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
