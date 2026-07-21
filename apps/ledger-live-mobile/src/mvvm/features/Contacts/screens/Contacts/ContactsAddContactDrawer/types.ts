export type ContactsAddContactDrawerLabels = Readonly<{
  title: string;
  namePlaceholder: string;
  namingDisclaimer: string;
  confirmName: string;
}>;

export type ContactsAddContactDrawerViewModel = Readonly<{
  isOpen: boolean;
  isConfirmEnabled: boolean;
  isSaving: boolean;
  draftName: string;
  labels: ContactsAddContactDrawerLabels;
  onOpen: () => void;
  onClose: () => void;
  onDraftNameChange: (name: string) => void;
  onConfirm: () => Promise<void>;
}>;
