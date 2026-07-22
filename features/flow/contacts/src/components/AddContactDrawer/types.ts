import type { ContactCreationPort } from "../../add/model/ports";

export type AddContactDrawerViewModel = Readonly<{
  isOpen: boolean;
  isConfirmEnabled: boolean;
  isSaving: boolean;
  draftName: string;
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
}>;

export type ContactsAddContactDrawerProps = AddContactDrawerViewModel &
  Readonly<{
    bottomInset?: number;
    keyboardInset?: number;
    labels: ContactsAddContactDrawerLabels;
  }>;
