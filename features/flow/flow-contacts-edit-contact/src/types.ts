import type { ContactId, ContactNameValidationErrorName } from "@domain/entity-contact";
import type { ContactEditPort } from "@features/platform-contacts";

export type RenameContactViewModel = Readonly<{
  draftName: string;
  invalidNameError: ContactNameValidationErrorName | null;
  isConfirmEnabled: boolean;
}>;

export type RenameContactDialogViewModel = RenameContactViewModel &
  Readonly<{
    isOpen: boolean;
    isSaving: boolean;
    onOpen: () => void;
    onClose: () => void;
    onDraftNameChange: (name: string) => void;
    onConfirm: () => Promise<void>;
  }>;

export type UseRenameContactDialogViewModelOptions = Readonly<{
  contactId: ContactId;
  currentName: string;
  editPort: ContactEditPort;
  isRequestedOpen: boolean;
  isEditSessionActive?: boolean;
  onCloseRequest: () => void;
  onSaveSuccess: () => void;
  requestSaveApproval?: () => Promise<boolean>;
}>;

export type ContactsRenameContactLabels = Readonly<{
  title: string;
  namePlaceholder: string;
  namingDisclaimer: string;
  applyChanges: string;
  confirmName: string;
  nameValidationErrors: Readonly<Record<ContactNameValidationErrorName, string>>;
}>;

export type ContactsRenameContactDialogProps = RenameContactDialogViewModel &
  Readonly<{
    labels: ContactsRenameContactLabels;
  }>;

export type ContactsRenameContactDrawerProps = RenameContactDialogViewModel &
  Readonly<{
    bottomInset?: number;
    keyboardInset?: number;
    /** Set once the hosting drawer has settled, so the keyboard does not interrupt it opening. */
    autoFocus?: boolean;
    labels: ContactsRenameContactLabels;
  }>;
