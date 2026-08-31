export type ContactsDeleteContactDialogLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type ContactsDeleteContactDialogProps = Readonly<{
  isOpen: boolean;
  isDeleting: boolean;
  labels: ContactsDeleteContactDialogLabels;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;

export type ContactsDeleteContactDrawerProps = ContactsDeleteContactDialogProps &
  Readonly<{
    bottomInset?: number;
  }>;
