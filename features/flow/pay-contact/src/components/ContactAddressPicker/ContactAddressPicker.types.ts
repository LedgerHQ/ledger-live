import type { Contact, ContactAddress } from "@domain/entity-contact";

export type ContactAddressPickerRowIcon = Readonly<{
  ledgerId: string;
  ticker: string;
  network?: string;
}>;

export type ContactAddressPickerRow = Readonly<{
  addressId: ContactAddress["id"];
  label: ContactAddress["label"];
  address: string;
  icon: ContactAddressPickerRowIcon;
  contactAddress: ContactAddress;
}>;

export type ContactAddressPickerNetworkGroup = Readonly<{
  networkId: string;
  networkName: string;
  networkTicker: string;
  rows: readonly ContactAddressPickerRow[];
}>;

export type ContactAddressPickerProps = Readonly<{
  isOpen: boolean;
  contact: Contact | null;
  title: string;
  addAddressLabel: string;
  groups: readonly ContactAddressPickerNetworkGroup[];
  onClose: () => void;
  onSelectAddress: (address: ContactAddress) => void;
  onAddNewAddress?: () => void;
}>;
