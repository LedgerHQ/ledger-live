import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { ContactAddressPickerProps } from "../../types";

export function ContactAddressPickerView({ isOpen, contact, onClose }: ContactAddressPickerProps) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen || !contact) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader density="expanded" title={contact.name} onClose={onClose} />
        <DialogBody className="flex flex-col gap-8" data-testid="pay-contact-address-picker" />
      </DialogContent>
    </Dialog>
  );
}
