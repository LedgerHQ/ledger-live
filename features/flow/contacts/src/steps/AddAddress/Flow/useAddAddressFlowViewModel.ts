import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  getContactAddressLabelValidationError,
  parseContactAddressLabel,
  type ContactAddress,
  type ContactAddressLabel,
  type ContactId,
} from "@domain/entity-contact";
import type {
  ContactsAddressValidationPort,
  ContactsAddressValidationResult,
} from "../model/ports";
import type {
  AddAddressContact,
  AddAddressCurrencySelection,
  AddAddressEntryState,
  AddAddressFlowState,
  AddAddressFlowViewModel,
  AddAddressInputSource,
  AddAddressLabelState,
} from "./types";

const CLOSED_ADD_ADDRESS_FLOW_STATE = {
  status: "closed",
} as const satisfies AddAddressFlowState;

const EMPTY_ADD_ADDRESS_ENTRY_STATE = {
  status: "empty",
  value: "",
  resolvedAddress: null,
  inputMethod: null,
} as const satisfies AddAddressEntryState;

const UNAVAILABLE_ADDRESS_VALIDATION: ContactsAddressValidationPort = {
  validateAddress: async () => ({ status: "unavailable" }),
};

export type UseAddAddressFlowViewModelOptions = Readonly<{
  addressValidation?: ContactsAddressValidationPort;
  manualValidationDebounceMs?: number;
}>;

function wait(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

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

function limitAddressLabelLength(value: string): string {
  return value.slice(0, CONTACT_ADDRESS_LABEL_MAX_LENGTH);
}

function resolveAddressEntryState(
  value: string,
  inputMethod: AddAddressInputSource,
  result: ContactsAddressValidationResult,
): AddAddressEntryState {
  switch (result.status) {
    case "valid":
      return {
        status: "valid",
        value,
        resolvedAddress: result.resolvedAddress,
        inputMethod: result.isDomain ? "ens" : inputMethod,
      };
    case "invalid_format":
    case "domain_not_found":
    case "sanctioned":
      return {
        status: "invalid",
        value,
        resolvedAddress: null,
        inputMethod:
          result.status === "domain_not_found" ||
          ((result.status === "invalid_format" || result.status === "sanctioned") &&
            result.isDomain)
            ? "ens"
            : inputMethod,
        error: result.status,
      };
    case "unavailable":
      return {
        status: "unavailable",
        value,
        resolvedAddress: null,
        inputMethod,
      };
  }
}

function createValidatingAddressEntryState(
  value: string,
  inputMethod: AddAddressInputSource,
): AddAddressEntryState {
  return {
    status: "validating",
    value,
    resolvedAddress: null,
    inputMethod,
  };
}

async function requestAddressValidation(
  addressValidation: ContactsAddressValidationPort,
  currencyId: ContactAddress["currencyId"],
  address: string,
): Promise<ContactsAddressValidationResult> {
  try {
    return await addressValidation.validateAddress({ currencyId, address });
  } catch {
    return { status: "unavailable" };
  }
}

function applyAddressEntryState(
  currentState: AddAddressFlowState,
  selectedCurrencyId: ContactAddress["currencyId"],
  addressEntry: AddAddressEntryState,
  expectedValue?: string,
): AddAddressFlowState {
  if (
    currentState.status !== "enteringAddress" ||
    currentState.selectedCurrencyId !== selectedCurrencyId ||
    (expectedValue !== undefined && currentState.addressEntry.value !== expectedValue)
  ) {
    return currentState;
  }

  return { ...currentState, addressEntry };
}

export function useAddAddressFlowViewModel({
  addressValidation = UNAVAILABLE_ADDRESS_VALIDATION,
  manualValidationDebounceMs = 0,
}: UseAddAddressFlowViewModelOptions = {}): AddAddressFlowViewModel {
  const [state, setState] = useState<AddAddressFlowState>(CLOSED_ADD_ADDRESS_FLOW_STATE);
  const validationRequestId = useRef(0);
  const cancelAddressValidation = useCallback(() => {
    validationRequestId.current += 1;
  }, []);
  const start = useCallback(
    (contact: AddAddressContact) => {
      cancelAddressValidation();
      setState({
        status: "selectingCurrency",
        selectedContactId: contact.id,
        existingAddressLabels: contact.addresses.map(address => address.label),
      });
    },
    [cancelAddressValidation],
  );
  const completeCurrencySelection = useCallback(
    (selectedContactId: ContactId, selection: AddAddressCurrencySelection) => {
      setState(currentState => {
        if (
          currentState.status !== "selectingCurrency" ||
          currentState.selectedContactId !== selectedContactId
        ) {
          return currentState;
        }

        return {
          status: "enteringAddress",
          selectedContactId,
          existingAddressLabels: currentState.existingAddressLabels,
          selectedCurrencyId: selection.currencyId,
          addressEntry: EMPTY_ADD_ADDRESS_ENTRY_STATE,
          addressLabel: createAddressLabelState(
            limitAddressLabelLength(selection.assetDisplayName),
            currentState.existingAddressLabels,
          ),
        };
      });
    },
    [],
  );
  const updateAddress = useCallback(
    async (value: string, inputMethod: AddAddressInputSource) => {
      if (state.status !== "enteringAddress") {
        return;
      }

      const normalizedAddress = value.trim();
      const selectedCurrencyId = state.selectedCurrencyId;
      const requestId = validationRequestId.current + 1;
      validationRequestId.current = requestId;

      if (normalizedAddress.length === 0) {
        setState(currentState =>
          applyAddressEntryState(currentState, selectedCurrencyId, EMPTY_ADD_ADDRESS_ENTRY_STATE),
        );
        return;
      }

      setState(currentState =>
        applyAddressEntryState(
          currentState,
          selectedCurrencyId,
          createValidatingAddressEntryState(value, inputMethod),
        ),
      );

      if (inputMethod === "manual" && manualValidationDebounceMs > 0) {
        await wait(manualValidationDebounceMs);
        if (validationRequestId.current !== requestId) {
          return;
        }
      }

      const validationResult = await requestAddressValidation(
        addressValidation,
        selectedCurrencyId,
        normalizedAddress,
      );

      if (validationRequestId.current !== requestId) {
        return;
      }

      setState(currentState =>
        applyAddressEntryState(
          currentState,
          selectedCurrencyId,
          resolveAddressEntryState(value, inputMethod, validationResult),
          value,
        ),
      );
    },
    [addressValidation, manualValidationDebounceMs, state],
  );
  const updateAddressLabel = useCallback((value: string) => {
    setState(currentState => {
      if (currentState.status !== "enteringAddress" && currentState.status !== "namingAddress") {
        return currentState;
      }

      return {
        ...currentState,
        addressLabel: createAddressLabelState(
          limitAddressLabelLength(value),
          currentState.existingAddressLabels,
        ),
      };
    });
  }, []);
  const confirmAddress = useCallback(() => {
    cancelAddressValidation();
    setState(currentState => {
      if (
        currentState.status !== "enteringAddress" ||
        currentState.addressEntry.status !== "valid"
      ) {
        return currentState;
      }

      return {
        status: "namingAddress",
        selectedContactId: currentState.selectedContactId,
        existingAddressLabels: currentState.existingAddressLabels,
        selectedCurrencyId: currentState.selectedCurrencyId,
        addressEntry: currentState.addressEntry,
        addressLabel: currentState.addressLabel,
      };
    });
  }, [cancelAddressValidation]);
  const continueFromName = useCallback(() => {
    setState(currentState => {
      if (currentState.status !== "namingAddress" || currentState.addressLabel.status !== "valid") {
        return currentState;
      }

      return {
        status: "reviewingAddress",
        selectedContactId: currentState.selectedContactId,
        existingAddressLabels: currentState.existingAddressLabels,
        selectedCurrencyId: currentState.selectedCurrencyId,
        addressEntry: currentState.addressEntry,
        addressLabel: currentState.addressLabel,
        origin: "addressName",
      };
    });
  }, []);
  const continueFromAddressDetails = useCallback(() => {
    cancelAddressValidation();
    setState(currentState => {
      if (
        currentState.status !== "enteringAddress" ||
        currentState.addressEntry.status !== "valid" ||
        currentState.addressLabel.status !== "valid"
      ) {
        return currentState;
      }

      return {
        status: "reviewingAddress",
        selectedContactId: currentState.selectedContactId,
        existingAddressLabels: currentState.existingAddressLabels,
        selectedCurrencyId: currentState.selectedCurrencyId,
        addressEntry: currentState.addressEntry,
        addressLabel: currentState.addressLabel,
        origin: "addressDetails",
      };
    });
  }, [cancelAddressValidation]);
  const continueFromReview = useCallback(() => {
    setState(currentState => {
      if (currentState.status !== "reviewingAddress") {
        return currentState;
      }

      const { origin, ...session } = currentState;
      return { ...session, status: "success" };
    });
  }, []);
  const goBack = useCallback(() => {
    cancelAddressValidation();
    setState(currentState => {
      switch (currentState.status) {
        case "closed":
          return currentState;
        case "selectingCurrency":
          return CLOSED_ADD_ADDRESS_FLOW_STATE;
        case "enteringAddress":
          return {
            status: "selectingCurrency",
            selectedContactId: currentState.selectedContactId,
            existingAddressLabels: currentState.existingAddressLabels,
          };
        case "namingAddress":
          return { ...currentState, status: "enteringAddress" };
        case "reviewingAddress": {
          const { origin, ...session } = currentState;
          return origin === "addressDetails"
            ? { ...session, status: "enteringAddress" }
            : { ...session, status: "namingAddress" };
        }
        case "success":
          return currentState;
      }
    });
  }, [cancelAddressValidation]);
  const close = useCallback(() => {
    cancelAddressValidation();
    setState(CLOSED_ADD_ADDRESS_FLOW_STATE);
  }, [cancelAddressValidation]);
  useEffect(() => () => cancelAddressValidation(), [cancelAddressValidation]);

  return {
    state,
    start,
    completeCurrencySelection,
    updateAddress,
    updateAddressLabel,
    confirmAddress,
    continueFromAddressDetails,
    continueFromName,
    continueFromReview,
    goBack,
    close,
  };
}
