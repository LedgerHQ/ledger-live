import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  getContactAddressLabelValidationError,
  parseContactAddressLabel,
  type ContactAddress,
  type ContactAddressLabel,
  type ContactId,
} from "@domain/entity-contact";
import { EMPTY_ADDRESS_ENTRY_STATE } from "@features/platform-contacts";
import type {
  AddAddressContact,
  AddAddressCurrencySelection,
  AddAddressEntryState,
  AddAddressFlowState,
  AddAddressLabelState,
  PrefillAddAddressParams,
  ValidAddAddressEntryState,
} from "./types";

export const CLOSED_ADD_ADDRESS_FLOW_STATE = {
  status: "closed",
} as const satisfies AddAddressFlowState;

export type AddAddressFlowAction =
  | Readonly<{ type: "start"; contact: AddAddressContact }>
  | Readonly<{
      type: "startWithPrefilled";
      params: PrefillAddAddressParams;
      addressEntry: ValidAddAddressEntryState;
    }>
  | Readonly<{
      type: "completeCurrencySelection";
      contactId: ContactId;
      selection: AddAddressCurrencySelection;
    }>
  | Readonly<{
      type: "updateAddressEntry";
      selectedCurrencyId: ContactAddress["currencyId"];
      addressEntry: AddAddressEntryState;
      expectedValue?: string;
    }>
  | Readonly<{ type: "updateAddressLabel"; value: string }>
  | Readonly<{ type: "confirmAddress" }>
  | Readonly<{ type: "continueFromAddressDetails" }>
  | Readonly<{ type: "continueFromName" }>
  | Readonly<{ type: "continueFromReview" }>
  | Readonly<{ type: "completeConfirmation" }>
  | Readonly<{ type: "goBack" }>
  | Readonly<{ type: "close" }>;

function createAddressLabelState(
  value: string,
  existingAddressLabels: readonly ContactAddressLabel[],
): AddAddressLabelState {
  const validationError = getContactAddressLabelValidationError(value, existingAddressLabels);

  if (value.trim().length === 0) {
    return {
      status: "empty",
      value,
      label: null,
      validationError: null,
    };
  }

  if (validationError) {
    return {
      status: "invalid",
      value,
      label: null,
      validationError,
    };
  }

  return {
    status: "valid",
    value,
    label: parseContactAddressLabel(value, existingAddressLabels),
    validationError: null,
  };
}

function createDefaultAddressLabelState(
  assetDisplayName: string,
  existingAddressLabels: readonly ContactAddressLabel[],
): AddAddressLabelState {
  return createAddressLabelState(limitAddressLabelLength(assetDisplayName), existingAddressLabels);
}

function limitAddressLabelLength(value: string): string {
  return value.slice(0, CONTACT_ADDRESS_LABEL_MAX_LENGTH);
}

type AddAddressFlowActionOf<Type extends AddAddressFlowAction["type"]> = Extract<
  AddAddressFlowAction,
  { type: Type }
>;

function reduceStart(action: AddAddressFlowActionOf<"start">): AddAddressFlowState {
  return {
    status: "selectingCurrency",
    selectedContactId: action.contact.id,
    existingAddressLabels: action.contact.addresses.map(address => address.label),
  };
}

function reduceStartWithPrefilled(
  action: AddAddressFlowActionOf<"startWithPrefilled">,
): AddAddressFlowState {
  const { contact, currency, network } = action.params;
  const existingAddressLabels = contact.addresses.map(address => address.label);
  return {
    status: "namingAddress",
    selectedContactId: contact.id,
    existingAddressLabels,
    selectedCurrencyId: currency.currencyId,
    entryMode: "prefilled",
    displayContext: { assetDisplayName: currency.assetDisplayName, network },
    addressEntry: action.addressEntry,
    addressLabel: createDefaultAddressLabelState(currency.assetDisplayName, existingAddressLabels),
  };
}

function reduceCompleteCurrencySelection(
  state: AddAddressFlowState,
  action: AddAddressFlowActionOf<"completeCurrencySelection">,
): AddAddressFlowState {
  if (state.status !== "selectingCurrency" || state.selectedContactId !== action.contactId) {
    return state;
  }
  return {
    ...state,
    status: "enteringAddress",
    selectedCurrencyId: action.selection.currencyId,
    entryMode: "mad",
    displayContext: null,
    addressEntry: EMPTY_ADDRESS_ENTRY_STATE,
    addressLabel: createDefaultAddressLabelState(
      action.selection.assetDisplayName,
      state.existingAddressLabels,
    ),
  };
}

function reduceUpdateAddressEntry(
  state: AddAddressFlowState,
  action: AddAddressFlowActionOf<"updateAddressEntry">,
): AddAddressFlowState {
  if (
    state.status !== "enteringAddress" ||
    state.selectedCurrencyId !== action.selectedCurrencyId ||
    (action.expectedValue !== undefined && state.addressEntry.value !== action.expectedValue)
  ) {
    return state;
  }
  return { ...state, addressEntry: action.addressEntry };
}

function reduceUpdateAddressLabel(
  state: AddAddressFlowState,
  action: AddAddressFlowActionOf<"updateAddressLabel">,
): AddAddressFlowState {
  if (state.status !== "enteringAddress" && state.status !== "namingAddress") {
    return state;
  }
  return {
    ...state,
    addressLabel: createAddressLabelState(
      limitAddressLabelLength(action.value),
      state.existingAddressLabels,
    ),
  };
}

function reduceConfirmAddress(state: AddAddressFlowState): AddAddressFlowState {
  if (state.status !== "enteringAddress" || state.addressEntry.status !== "valid") {
    return state;
  }
  return { ...state, status: "namingAddress", addressEntry: state.addressEntry };
}

function reduceContinueFromAddressDetails(state: AddAddressFlowState): AddAddressFlowState {
  if (
    state.status !== "enteringAddress" ||
    state.addressEntry.status !== "valid" ||
    state.addressLabel.status !== "valid"
  ) {
    return state;
  }
  return {
    ...state,
    status: "reviewingAddress",
    origin: "addressDetails",
    addressEntry: state.addressEntry,
    addressLabel: state.addressLabel,
  };
}

function reduceContinueFromName(state: AddAddressFlowState): AddAddressFlowState {
  if (state.status !== "namingAddress" || state.addressLabel.status !== "valid") {
    return state;
  }
  return state.entryMode === "prefilled"
    ? {
        ...state,
        status: "reviewingAddress",
        origin: "addressName",
        addressLabel: state.addressLabel,
      }
    : { ...state, status: "confirmationRequired", addressLabel: state.addressLabel };
}

function reduceContinueFromReview(state: AddAddressFlowState): AddAddressFlowState {
  if (state.status !== "reviewingAddress") {
    return state;
  }
  const { origin: _origin, ...session } = state;
  return { ...session, status: "success" };
}

function reduceCompleteConfirmation(state: AddAddressFlowState): AddAddressFlowState {
  if (state.status !== "confirmationRequired") {
    return state;
  }
  return {
    ...state,
    status: "success",
    target: { type: "contactDetail", contactId: state.selectedContactId },
  };
}

function goBack(state: AddAddressFlowState): AddAddressFlowState {
  switch (state.status) {
    case "closed":
    case "success":
      return state;
    case "selectingCurrency":
      return CLOSED_ADD_ADDRESS_FLOW_STATE;
    case "enteringAddress":
      return {
        status: "selectingCurrency",
        selectedContactId: state.selectedContactId,
        existingAddressLabels: state.existingAddressLabels,
      };
    case "namingAddress":
      return state.entryMode === "prefilled"
        ? CLOSED_ADD_ADDRESS_FLOW_STATE
        : { ...state, status: "enteringAddress" };
    case "reviewingAddress": {
      const { origin, ...session } = state;
      return origin === "addressDetails"
        ? { ...session, status: "enteringAddress" }
        : { ...session, status: "namingAddress" };
    }
    case "confirmationRequired":
      return { ...state, status: "namingAddress" };
  }
}

export function addAddressFlowReducer(
  state: AddAddressFlowState,
  action: AddAddressFlowAction,
): AddAddressFlowState {
  switch (action.type) {
    case "start":
      return reduceStart(action);
    case "startWithPrefilled":
      return reduceStartWithPrefilled(action);
    case "completeCurrencySelection":
      return reduceCompleteCurrencySelection(state, action);
    case "updateAddressEntry":
      return reduceUpdateAddressEntry(state, action);
    case "updateAddressLabel":
      return reduceUpdateAddressLabel(state, action);
    case "confirmAddress":
      return reduceConfirmAddress(state);
    case "continueFromAddressDetails":
      return reduceContinueFromAddressDetails(state);
    case "continueFromName":
      return reduceContinueFromName(state);
    case "continueFromReview":
      return reduceContinueFromReview(state);
    case "completeConfirmation":
      return reduceCompleteConfirmation(state);
    case "goBack":
      return goBack(state);
    case "close":
      return CLOSED_ADD_ADDRESS_FLOW_STATE;
  }
}
