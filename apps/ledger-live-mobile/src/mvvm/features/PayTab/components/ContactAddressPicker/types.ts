import type { Contact, ContactAddress } from "@domain/entity-contact";

export type ContactAddressPickerProps = Readonly<{
  contact: Contact | null;
  onClose: () => void;
  onSelectAddress: (address: ContactAddress) => void;
}>;
