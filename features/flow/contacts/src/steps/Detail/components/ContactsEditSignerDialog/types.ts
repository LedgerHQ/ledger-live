export type ContactsEditSignerDialogLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type ContactsEditSignerDialogProps = Readonly<{
  isOpen: boolean;
  labels: ContactsEditSignerDialogLabels;
  onConfirm: () => void;
  onCancel: () => void;
}>;

export type ContactsEditSignerDrawerProps = ContactsEditSignerDialogProps &
  Readonly<{
    bottomInset?: number;
  }>;
