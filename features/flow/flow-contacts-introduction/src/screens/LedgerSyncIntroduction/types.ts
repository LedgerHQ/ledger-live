export type ContactsLedgerSyncIntroductionContentProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  activateLabel: string;
  dismissLabel: string;
  bottomInset: number;
  onActivate: () => void;
  onDismiss: () => void;
}>;

export type ContactsLedgerSyncIntroductionDialogProps = Readonly<{
  open: boolean;
  description: string;
  dismissLabel: string;
  onDismiss: () => void;
}>;
