export type ContactsDeleteConfirmationDialogLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type ContactsDeleteConfirmationDialogProps = Readonly<{
  isOpen: boolean;
  isDeleting: boolean;
  labels: ContactsDeleteConfirmationDialogLabels;
  dialogTestId: string;
  confirmTestId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;
