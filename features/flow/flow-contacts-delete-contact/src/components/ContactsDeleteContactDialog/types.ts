export type ContactsDeleteContactDialogProps = Readonly<{
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;

export type ContactsDeleteContactDrawerProps = ContactsDeleteContactDialogProps &
  Readonly<{
    bottomInset?: number;
  }>;
