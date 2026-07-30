import type { ContactAddress, ContactId } from "@domain/entity-contact";

export type AddAddressInputMethod = "manual" | "paste" | "qr_code" | "ens";
export type AddAddressInputSource = Exclude<AddAddressInputMethod, "ens">;

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
      error: "invalid_format" | "domain_not_found";
    }>
  | Readonly<{
      status: "unavailable";
      value: string;
      resolvedAddress: null;
      inputMethod: AddAddressInputSource;
    }>;

export type ValidAddAddressEntryState = Extract<AddAddressEntryState, { status: "valid" }>;

type AddAddressSession = Readonly<{
  selectedContactId: ContactId;
  selectedCurrencyId: ContactAddress["currencyId"];
  addressEntry: AddAddressEntryState;
}>;

type ConfirmedAddAddressSession = Omit<AddAddressSession, "addressEntry"> &
  Readonly<{
    addressEntry: ValidAddAddressEntryState;
  }>;

export type AddAddressFlowState =
  | Readonly<{ status: "closed" }>
  | Readonly<{
      status: "selectingCurrency";
      selectedContactId: ContactId;
    }>
  | (AddAddressSession & Readonly<{ status: "enteringAddress" }>)
  | (ConfirmedAddAddressSession & Readonly<{ status: "namingAddress" }>)
  | (ConfirmedAddAddressSession & Readonly<{ status: "reviewingAddress" }>)
  | (ConfirmedAddAddressSession & Readonly<{ status: "success" }>);

export type AddAddressFlowViewModel = Readonly<{
  state: AddAddressFlowState;
  start: (contactId: ContactId) => void;
  completeCurrencySelection: (
    contactId: ContactId,
    currencyId: ContactAddress["currencyId"],
  ) => void;
  updateAddress: (address: string, inputMethod: AddAddressInputSource) => Promise<void>;
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
  validationUnavailable: string;
  ensDisclaimer: string;
}>;

export type AddAddressPlaceholderViewProps = Readonly<{
  title: string;
  buttonLabel: string;
  testID: string;
  onContinue: () => void;
}>;
