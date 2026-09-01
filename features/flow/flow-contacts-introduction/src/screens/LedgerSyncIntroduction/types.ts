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
  title: string;
  description: string;
  activateLabel: string;
  dismissLabel: string;
  onActivate: () => void;
  onDismiss: () => void;
}>;
