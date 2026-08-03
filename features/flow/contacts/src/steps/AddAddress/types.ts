import type {
  Contact,
  ContactAddress,
  ContactAddressLabel,
  ContactAddressLabelValidationErrorName,
  ContactId,
} from "@domain/entity-contact";

export type AddAddressInputMethod = "manual" | "paste" | "qr_code" | "ens";
export type AddAddressInputSource = Exclude<AddAddressInputMethod, "ens">;

export type AddAddressContact = Pick<Contact, "id" | "addresses">;

export type AddAddressCurrencySelection = Readonly<{
  currencyId: ContactAddress["currencyId"];
  assetDisplayName: string;
}>;

export type AddAddressEntryState =
  | Readonly<{
      status: "empty";
      value: "";
      resolvedAddress: null;
      inputMethod: null;
    }>
  | Readonly<{
      status: "validating";
      value: string;
      resolvedAddress: null;
      inputMethod: AddAddressInputSource;
    }>
  | Readonly<{
      status: "valid";
      value: string;
      resolvedAddress: ContactAddress["address"];
      inputMethod: AddAddressInputMethod;
    }>
  | Readonly<{
      status: "invalid";
      value: string;
      resolvedAddress: null;
      inputMethod: AddAddressInputMethod;
      error: "invalid_format" | "domain_not_found" | "sanctioned";
    }>
  | Readonly<{
      status: "unavailable";
      value: string;
      resolvedAddress: null;
      inputMethod: AddAddressInputSource;
    }>;

export type AddAddressLabelState =
  | Readonly<{
      status: "empty";
      value: string;
      label: null;
      validationError: null;
    }>
  | Readonly<{
      status: "invalid";
      value: string;
      label: null;
      validationError: ContactAddressLabelValidationErrorName;
    }>
  | Readonly<{
      status: "valid";
      value: string;
      label: ContactAddressLabel;
      validationError: null;
    }>;

export type ValidAddAddressEntryState = Extract<AddAddressEntryState, { status: "valid" }>;
export type ValidAddAddressLabelState = Extract<AddAddressLabelState, { status: "valid" }>;

type AddAddressSession = Readonly<{
  selectedContactId: ContactId;
  existingAddressLabels: readonly ContactAddress["label"][];
  selectedCurrencyId: ContactAddress["currencyId"];
  addressEntry: AddAddressEntryState;
  addressLabel: AddAddressLabelState;
}>;

type ConfirmedAddAddressSession = Omit<AddAddressSession, "addressEntry"> &
  Readonly<{
    addressEntry: ValidAddAddressEntryState;
  }>;

type NamedAddAddressSession = Omit<ConfirmedAddAddressSession, "addressLabel"> &
  Readonly<{
    addressLabel: ValidAddAddressLabelState;
  }>;

export type AddAddressFlowState =
  | Readonly<{ status: "closed" }>
  | Readonly<{
      status: "selectingCurrency";
      selectedContactId: ContactId;
      existingAddressLabels: readonly ContactAddress["label"][];
    }>
  | (AddAddressSession & Readonly<{ status: "enteringAddress" }>)
  | (ConfirmedAddAddressSession & Readonly<{ status: "namingAddress" }>)
  | (NamedAddAddressSession & Readonly<{ status: "reviewingAddress" }>)
  | (NamedAddAddressSession & Readonly<{ status: "success" }>);

export type AddAddressFlowViewModel = Readonly<{
  state: AddAddressFlowState;
  start: (contact: AddAddressContact) => void;
  completeCurrencySelection: (contactId: ContactId, selection: AddAddressCurrencySelection) => void;
  updateAddress: (address: string, inputMethod: AddAddressInputSource) => Promise<void>;
  updateAddressLabel: (label: string) => void;
  confirmAddress: () => void;
  continueFromName: () => void;
  continueFromReview: () => void;
  goBack: () => void;
  close: () => void;
}>;

export type AddAddressEntryLabels = Readonly<{
  title: string;
  addressPlaceholder: string;
  confirmAddress: string;
  validatingAddress: string;
  validAddress: string;
  invalidAddress: string;
  domainNotFound: string;
  sanctionedAddress: string;
  validationUnavailable: string;
  ensDisclaimer: string;
}>;

export type AddAddressNameLabels = Readonly<{
  title: string;
  inputLabel: string;
  namingDisclaimer: string;
  continueToReview: string;
  validationErrors: Readonly<Record<ContactAddressLabelValidationErrorName, string>>;
}>;

export type AddAddressPlaceholderViewProps = Readonly<{
  title: string;
  buttonLabel: string;
  testID: string;
  onContinue: () => void;
}>;
