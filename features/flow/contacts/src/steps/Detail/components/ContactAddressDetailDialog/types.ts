import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRow } from "../../types";

export type ContactAddressDetailDialogLabels = Readonly<{
  send: string;
  copy: string;
  copied: string;
  edit: string;
  delete: string;
  formatNetworkTag: (networkName: string) => string;
}>;

export type ContactAddressDetailDialogNativeLabels = ContactAddressDetailDialogLabels &
  Readonly<{
    copyAddress: string;
    share: string;
  }>;

export type ContactAddressDetailDialogProps = Readonly<{
  isOpen: boolean;
  contactName: string;
  row: ContactDetailAddressRow | undefined;
  network: ContactDetailAddressNetworkGroup | undefined;
  labels: ContactAddressDetailDialogLabels;
  onClose: () => void;
}>;

export type ContactAddressDetailDialogNativeProps = Omit<
  ContactAddressDetailDialogProps,
  "labels"
> &
  Readonly<{
    labels: ContactAddressDetailDialogNativeLabels;
    bottomInset?: number;
    onCopyAddress?: (address: string) => void;
  }>;
