export type ContactsDeleteContactDialogProps = Readonly<{
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;
