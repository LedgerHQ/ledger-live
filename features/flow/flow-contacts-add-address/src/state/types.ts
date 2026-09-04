import type {
  Contact,
  ContactAddress,
  ContactAddressLabel,
  ContactAddressLabelValidationErrorName,
  ContactId,
} from "@domain/entity-contact";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputMethod,
  ContactsAddressInputSource,
} from "@features/platform-contacts";

export type AddAddressInputMethod = ContactsAddressInputMethod;
export type AddAddressInputSource = ContactsAddressInputSource;

export type AddAddressContact = Pick<Contact, "id" | "addresses">;

export type AddAddressCurrencySelection = Readonly<{
  currencyId: ContactAddress["currencyId"];
  assetDisplayName: string;
}>;

export type AddAddressNetworkContext = Readonly<{
  networkId: string;
  displayName: string;
}>;

export type AddAddressEntryMode = "mad" | "prefilled";

export type AddAddressDisplayContext = Readonly<{
  assetDisplayName: string;
  network: AddAddressNetworkContext;
}>;

export type PrefillAddAddressParams = Readonly<{
  contact: AddAddressContact;
  address: string;
  currency: AddAddressCurrencySelection;
  network: AddAddressNetworkContext;
}>;

export type PrefillAddAddressInvalidReason = "invalid_format" | "domain_not_found" | "sanctioned";

export type PrefillAddAddressStartResult =
  | Readonly<{ status: "started" }>
  | Readonly<{
      status: "invalid_address";
      error: PrefillAddAddressInvalidReason;
    }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "unavailable" }>;

export type AddAddressEntryState = ContactsAddressEntryState;

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
  entryMode: AddAddressEntryMode;
  displayContext: AddAddressDisplayContext | null;
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

export type AddAddressContactDetailTarget = Readonly<{
  type: "contactDetail";
  contactId: ContactId;
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
  | (NamedAddAddressSession &
      Readonly<{
        status: "reviewingAddress";
        origin: "addressDetails" | "addressName";
      }>)
  | (NamedAddAddressSession & Readonly<{ status: "confirmationRequired" }>)
  | (NamedAddAddressSession &
      Readonly<{
        status: "success";
        target?: AddAddressContactDetailTarget;
      }>);

export type AddAddressFlowViewModel = Readonly<{
  state: AddAddressFlowState;
  start: (contact: AddAddressContact) => void;
  startWithPrefilled: (params: PrefillAddAddressParams) => Promise<PrefillAddAddressStartResult>;
  completeCurrencySelection: (contactId: ContactId, selection: AddAddressCurrencySelection) => void;
  updateAddress: (address: string, inputMethod: AddAddressInputSource) => Promise<void>;
  updateAddressLabel: (label: string) => void;
  confirmAddress: () => void;
  continueFromAddressDetails: () => void;
  continueFromName: () => void;
  continueFromReview: () => void;
  completeConfirmation: () => void;
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
