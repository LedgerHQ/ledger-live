export type ContactsDeleteAddressDialogProps = Readonly<{
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;

export type ContactsDeleteAddressDrawerProps = ContactsDeleteAddressDialogProps &
  Readonly<{
    bottomInset?: number;
  }>;
