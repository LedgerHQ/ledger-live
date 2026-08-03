import type { ContactId, ContactNameValidationErrorName } from "@domain/entity-contact";
import type { ContactEditPort } from "../Detail/model/ports";

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
  onSaveSuccess: () => void;
}>;

export type ContactsRenameContactLabels = Readonly<{
  title: string;
  namePlaceholder: string;
  namingDisclaimer: string;
  applyChanges: string;
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
    labels: ContactsRenameContactLabels;
  }>;
