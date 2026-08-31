export type ContactsEditSignerMismatchDialogLabels = Readonly<{
  title: string;
  description: string;
  connectDifferentDevice: string;
  cancel: string;
}>;

export type ContactsEditSignerMismatchDialogProps = Readonly<{
  isOpen: boolean;
  labels: ContactsEditSignerMismatchDialogLabels;
  onConnectDifferentDevice: () => void;
  onCancel: () => void;
}>;

export type ContactsEditSignerMismatchDrawerProps = ContactsEditSignerMismatchDialogProps &
  Readonly<{
    bottomInset?: number;
  }>;
