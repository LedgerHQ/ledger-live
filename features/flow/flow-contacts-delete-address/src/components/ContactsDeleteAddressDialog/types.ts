export type ContactsDeleteAddressDialogLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type ContactsDeleteAddressDialogProps = Readonly<{
  isOpen: boolean;
  isDeleting: boolean;
  labels: ContactsDeleteAddressDialogLabels;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;

export type ContactsDeleteAddressDrawerProps = ContactsDeleteAddressDialogProps &
  Readonly<{
    bottomInset?: number;
  }>;
