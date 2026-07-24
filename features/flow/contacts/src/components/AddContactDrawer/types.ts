import type { ContactNameValidationErrorName } from "@domain/entity-contact";
import type { ContactCreationPort } from "../../add/model/ports";

export type AddContactDrawerViewModel = Readonly<{
  isOpen: boolean;
  isConfirmEnabled: boolean;
  isSaving: boolean;
  draftName: string;
  avatarInitial: string;
  invalidNameError: ContactNameValidationErrorName | null;
  onOpen: () => void;
  onClose: () => void;
  onDraftNameChange: (name: string) => void;
  onConfirm: () => Promise<void>;
}>;

export type UseAddContactDrawerViewModelOptions = Readonly<{
  contactCreation: ContactCreationPort;
  onSaveSuccess: () => void;
}>;

export type ContactsAddContactDrawerLabels = Readonly<{
  title: string;
  namePlaceholder: string;
  namingDisclaimer: string;
  confirmName: string;
  nameValidationErrors: Readonly<Record<ContactNameValidationErrorName, string>>;
}>;

export type ContactsAddContactDrawerProps = AddContactDrawerViewModel &
  Readonly<{
    bottomInset?: number;
    keyboardInset?: number;
    labels: ContactsAddContactDrawerLabels;
  }>;

export type ContactsAddContactDialogLabels = ContactsAddContactDrawerLabels;

export type ContactsAddContactDialogProps = AddContactDrawerViewModel &
  Readonly<{
    labels: ContactsAddContactDialogLabels;
  }>;
