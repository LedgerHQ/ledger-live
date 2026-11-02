export type ContactConfirmationDialogLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type ContactConfirmationDialogProps = Readonly<{
  isOpen: boolean;
  /** `destructive` confirms a deletion, `neutral` any other choice. */
  tone: "destructive" | "neutral";
  labels: ContactConfirmationDialogLabels;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Anchor for the dialog's content, present only while it is open. */
  testID?: string;
  confirmTestID?: string;
  cancelTestID?: string;
}>;
