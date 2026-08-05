import type {
  ContactAddress,
  ContactAddressId,
  ContactAddressLabel,
  ContactAddressLabelValidationErrorName,
  ContactId,
} from "@domain/entity-contact";
import type { ContactAddressEditPort } from "../Detail/model/ports";

export type RenameAddressViewModel = Readonly<{
  draftLabel: string;
  invalidLabelError: ContactAddressLabelValidationErrorName | null;
  isConfirmEnabled: boolean;
}>;

export type RenameAddressDialogViewModel = RenameAddressViewModel &
  Readonly<{
    isOpen: boolean;
    isSaving: boolean;
    onOpen: () => void;
    onClose: () => void;
    onDraftLabelChange: (label: string) => void;
    onConfirm: () => Promise<void>;
  }>;

export type UseRenameAddressDialogViewModelOptions = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  currentLabel: string;
  existingLabels: readonly ContactAddressLabel[];
  editPort: ContactAddressEditPort;
  onSaveSuccess: () => void;
}>;

export type ContactsRenameAddressLabels = Readonly<{
  title: string;
  inputLabel: string;
  applyChanges: string;
  labelValidationErrors: Readonly<Record<ContactAddressLabelValidationErrorName, string>>;
}>;

export type ContactsRenameAddressDialogProps = RenameAddressDialogViewModel &
  Readonly<{
    labels: ContactsRenameAddressLabels;
  }>;

export type ContactsRenameAddressDrawerProps = RenameAddressDialogViewModel &
  Readonly<{
    bottomInset?: number;
    labels: ContactsRenameAddressLabels;
  }>;

export type RenameAddressSaveInput = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  label: ContactAddressLabel;
}>;

export type RenameAddressController = Readonly<{
  getViewModel: (
    draftLabel: string,
    currentLabel: string,
    existingLabels: readonly ContactAddressLabel[],
  ) => RenameAddressViewModel;
  save: (
    contactId: ContactId,
    addressId: ContactAddressId,
    draftLabel: string,
    existingLabels: readonly ContactAddressLabel[],
  ) => Promise<ContactAddress>;
}>;
