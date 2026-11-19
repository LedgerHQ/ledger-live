import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { ZonePlaceholder } from "./components/ZonePlaceholder";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView({
  title,
  networkLabel,
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
  // The close button, Escape and a click outside all leave through here.
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        // The network label describes the dialog once known; until then there is no description.
        {...(!networkLabel && { "aria-describedby": undefined })}
        data-testid="receive-address"
      >
        <DialogBackgroundToneProvider>
          <DialogHeader
            density="compact"
            title={title}
            description={networkLabel}
            onBack={onBack}
          />
          <DialogBody className="flex flex-col gap-24">
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
