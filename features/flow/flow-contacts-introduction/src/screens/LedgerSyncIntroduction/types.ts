export type ContactsLedgerSyncIntroductionContentProps = Readonly<{
  isOpen: boolean;
  bottomInset: number;
  onActivate: () => void;
  onDismiss: () => void;
}>;

export type ContactsLedgerSyncIntroductionDialogProps = Readonly<{
  open: boolean;
  onActivate: () => void;
  onDismiss: () => void;
}>;
