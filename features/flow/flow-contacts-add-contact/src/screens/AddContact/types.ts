import type { Contact, ContactNameValidationErrorName } from "@domain/entity-contact";
import type { ContactCreationPort } from "./model/ports";

export type AddContactContentViewModel = Readonly<{
  isConfirmEnabled: boolean;
  isSaving: boolean;
  draftName: string;
  avatarInitial: string;
  invalidNameError: ContactNameValidationErrorName | null;
  onDraftNameChange: (name: string) => void;
  onConfirm: () => Promise<Contact | undefined>;
  reset: () => void;
}>;

export type UseAddContactContentViewModelOptions = Readonly<{
  contactCreation: ContactCreationPort;
  onSaveSuccess: (contact: Contact) => void;
}>;

export type ContactsAddContactContentLabels = Readonly<{
  title: string;
  namePlaceholder: string;
  namingDisclaimer: string;
  confirmName: string;
  nameValidationErrors: Readonly<Record<ContactNameValidationErrorName, string>>;
}>;

export type ContactsAddContactContentProps = AddContactContentViewModel &
  Readonly<{
    labels: ContactsAddContactContentLabels;
  }>;
