import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { ZonePlaceholder } from "./components/ZonePlaceholder";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView({ onClose }: ReceiveAddressViewProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} data-testid="receive-address">
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" onClose={onClose} />
          <DialogBody className="flex flex-col gap-24">
            <ZonePlaceholder zone="header" />
            <ZonePlaceholder zone="summary" />
            <ZonePlaceholder zone="address" />
            <ZonePlaceholder zone="actions" />
            <ZonePlaceholder zone="notices" />
            <ZonePlaceholder zone="extras" />
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
