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
    isDeviceRequired: boolean;
    labels: ContactsRenameContactLabels;
  }>;

export type ContactsRenameContactDrawerProps = ContactsRenameContactDialogProps &
  Readonly<{
    autoFocus?: boolean;
    bottomInset?: number;
  }>;

export type ContactsRenameContactFooterProps = Pick<
  ContactsRenameContactDialogProps,
  "isConfirmEnabled" | "isSaving" | "isDeviceRequired" | "labels" | "onConfirm"
>;
