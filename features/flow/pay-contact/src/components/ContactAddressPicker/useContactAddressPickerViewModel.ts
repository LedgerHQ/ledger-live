import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import type { ContactAddressPickerProps } from "../../types";
import { buildContactAddressPickerGroups } from "./model/buildContactAddressPickerGroups";

export type UseContactAddressPickerViewModelParams = Readonly<{
  onSelectAddress: (address: ContactAddress) => void;
  onAddNewAddress?: (contact: Contact) => void;
}>;

export type UseContactAddressPickerViewModel = Readonly<{
  open: (contact: Contact) => void;
  close: () => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function useContactAddressPickerViewModel({
  onSelectAddress,
  onAddNewAddress,
}: UseContactAddressPickerViewModelParams): UseContactAddressPickerViewModel {
  const { t } = useTranslation();
  const [contact, setContact] = useState<Contact | null>(null);

  const open = useCallback((nextContact: Contact) => setContact(nextContact), []);
  const close = useCallback(() => setContact(null), []);

  const groups = useMemo(
    () => (contact === null ? [] : buildContactAddressPickerGroups(contact)),
    [contact],
  );

  const title = useMemo(
    () =>
      contact === null ? "" : t("payTab.contacts.addressPicker.title", { name: contact.name }),
    [contact, t],
  );

  const handleAddNewAddress = useMemo(
    () =>
      onAddNewAddress !== undefined && contact !== null
        ? () => onAddNewAddress(contact)
        : undefined,
    [onAddNewAddress, contact],
  );

  const contactAddressPicker = useMemo<ContactAddressPickerProps>(
    () => ({
      isOpen: contact !== null,
      contact,
      title,
      addAddressLabel: t("payTab.contacts.addressPicker.addAddress"),
      groups,
      onClose: close,
      onSelectAddress,
      onAddNewAddress: handleAddNewAddress,
    }),
    [contact, title, groups, t, close, onSelectAddress, handleAddNewAddress],
  );

  return {
    open,
    close,
    contactAddressPicker,
  };
}
