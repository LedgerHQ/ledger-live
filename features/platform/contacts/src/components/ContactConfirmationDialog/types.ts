export type ContactConfirmationDialogLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type ContactConfirmationDialogProps = Readonly<{
  isOpen: boolean;
  isDeleting: boolean;
  labels: ContactConfirmationDialogLabels;
  dialogTestId: string;
  confirmTestId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}>;
