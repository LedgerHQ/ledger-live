import type {
  ContactAddress,
  ContactAddressId,
  ContactAddressLabel,
  ContactAddressLabelValidationErrorName,
  ContactId,
} from "@domain/entity-contact";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputMethod,
  ContactsAddressInputSource,
  ContactAddressEditPort,
} from "@features/platform-contacts";

export type ContactAddressEditSavePayload = Readonly<{
  currencyId: ContactAddress["currencyId"] | undefined;
  inputMethod: ContactsAddressInputMethod | null;
  labelChanged: boolean;
  addressChanged: boolean;
}>;

export type RenameAddressViewModel = Readonly<{
  draftLabel: string;
  invalidLabelError: ContactAddressLabelValidationErrorName | null;
  isConfirmEnabled: boolean;
}>;

export type RenameAddressDialogViewModel = RenameAddressViewModel &
  Readonly<{
    isOpen: boolean;
    isSaving: boolean;
    addressEntry: ContactsAddressEntryState;
    onOpen: () => void;
    onClose: () => void;
    onDraftLabelChange: (label: string) => void;
    onAddressChange: (value: string, inputMethod: ContactsAddressInputSource) => void;
    onConfirm: () => Promise<void>;
  }>;

export type UseRenameAddressViewModelOptions = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  currentLabel: string;
  currentAddress: ContactAddress["address"] | undefined;
  existingLabels: readonly ContactAddressLabel[];
  editPort: ContactAddressEditPort;
  addressEntry: ContactsAddressEntryState;
  draftLabel: string;
}>;

export type UseRenameAddressDialogViewModelOptions = Omit<
  UseRenameAddressViewModelOptions,
  "addressEntry" | "draftLabel"
> &
  Readonly<{
    currencyId: ContactAddress["currencyId"] | undefined;
    isRequestedOpen: boolean;
    isEditSessionActive?: boolean;
    onCloseRequest: () => void;
    /** Called once the save is committed, before its outcome is known. */
    onSaveStart?: () => void;
    onSaveSuccess?: (payload: ContactAddressEditSavePayload) => void;
    requestSaveApproval?: () => Promise<boolean>;
  }>;

export type ContactsEditAddressValidationLabels = Readonly<{
  addressPlaceholder: string;
  validatingAddress: string;
  validAddress: string;
  invalidAddress: string;
  domainNotFound: string;
  sanctionedAddress: string;
  validationUnavailable: string;
  ensDisclaimer: string;
}>;

export type EditAddressAddressEntryPresentation = Readonly<{
  value: string;
  inputStatus?: "error" | "success";
  helperText?: string;
  showEnsDisclaimer: boolean;
  onChangeText: (value: string) => void;
}>;

export type ContactsRenameAddressLabels = Readonly<{
  title: string;
  inputLabel: string;
  applyChanges: string;
  labelValidationErrors: Readonly<Record<ContactAddressLabelValidationErrorName, string>>;
  addressValidation: ContactsEditAddressValidationLabels;
}>;

export type ContactsRenameAddressDialogProps = RenameAddressDialogViewModel &
  Readonly<{
    labels: ContactsRenameAddressLabels;
  }>;

export type ContactsRenameAddressDrawerProps = RenameAddressDialogViewModel &
  Readonly<{
    bottomInset?: number;
    keyboardInset?: number;
    labels: ContactsRenameAddressLabels;
  }>;

export type RenameAddressController = Readonly<{
  getViewModel: (
    draftLabel: string,
    currentLabel: string,
    currentAddress: ContactAddress["address"] | undefined,
    addressEntry: ContactsAddressEntryState,
    existingLabels: readonly ContactAddressLabel[],
  ) => RenameAddressViewModel;
  save: (
    contactId: ContactId,
    addressId: ContactAddressId,
    draftLabel: string,
    addressEntry: ContactsAddressEntryState,
    existingLabels: readonly ContactAddressLabel[],
  ) => Promise<ContactAddress>;
}>;
