import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { ContactAddressPickerProps } from "../../types";
import { ContactAddressPickerAddAddress } from "./components/ContactAddressPickerAddAddress/ContactAddressPickerAddAddress.web";
import { ContactAddressPickerNetworkSection } from "./components/ContactAddressPickerNetworkSection/ContactAddressPickerNetworkSection.web";

export function ContactAddressPicker({
  isOpen,
  contact,
  title,
  addAddressLabel,
  groups,
  onClose,
  onSelectAddress,
  onAddNewAddress,
}: ContactAddressPickerProps) {
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
        <DialogHeader density="expanded" title={title} onClose={onClose} />
        <DialogBody className="flex flex-col gap-24" data-testid="pay-contact-address-picker">
          {groups.map(group => (
            <ContactAddressPickerNetworkSection
              key={group.networkId}
              group={group}
              onSelectAddress={onSelectAddress}
            />
          ))}
          {onAddNewAddress ? (
            <ContactAddressPickerAddAddress
              label={addAddressLabel}
              onAddNewAddress={onAddNewAddress}
            />
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
