import { useCallback, useMemo, useState } from "react";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "../../types";

export type UseContactAddressPickerViewModelParams = Readonly<{
  onSelectAddress: (address: ContactAddress) => void;
  onAddNewContact?: () => void;
}>;

export type UseContactAddressPickerViewModel = Readonly<{
  open: (contact: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function useContactAddressPickerViewModel({
  onSelectAddress,
  onAddNewContact,
}: UseContactAddressPickerViewModelParams): UseContactAddressPickerViewModel {
  const [contact, setContact] = useState<Contact | null>(null);

  const open = useCallback((nextContact: Contact) => setContact(nextContact), []);
  const onClose = useCallback(() => setContact(null), []);
  const contactAddressPicker = useMemo(
    (): ContactAddressPickerProps => ({
      isOpen: contact !== null,
      contact,
      onClose,
      onSelectAddress,
      onAddNewContact,
    }),
    [contact, onClose, onSelectAddress, onAddNewContact],
  );

  return {
    open,
    contactAddressPicker,
  };
}
