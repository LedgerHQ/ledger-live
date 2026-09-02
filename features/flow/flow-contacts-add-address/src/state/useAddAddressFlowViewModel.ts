import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  getContactAddressLabelValidationError,
  parseContactAddressLabel,
  type ContactAddress,
  type ContactAddressLabel,
  type ContactId,
} from "@domain/entity-contact";
import {
  createValidatingAddressEntryState,
  EMPTY_ADDRESS_ENTRY_STATE,
  requestAddressValidation,
  resolveAddressEntryState,
  wait,
} from "@features/platform-contacts";
import type { ContactsAddressValidationPort } from "@features/platform-contacts";
import type {
  AddAddressContact,
  AddAddressCurrencySelection,
  AddAddressEntryState,
  AddAddressFlowState,
  AddAddressFlowViewModel,
  AddAddressInputSource,
  AddAddressLabelState,
  PrefillAddAddressParams,
  PrefillAddAddressStartResult,
  ValidAddAddressEntryState,
} from "./types";

const CLOSED_ADD_ADDRESS_FLOW_STATE = {
  status: "closed",
} as const satisfies AddAddressFlowState;

const UNAVAILABLE_ADDRESS_VALIDATION: ContactsAddressValidationPort = {
  validateAddress: async () => ({ status: "unavailable" }),
};

export type UseAddAddressFlowViewModelOptions = Readonly<{
  addressValidation?: ContactsAddressValidationPort;
  manualValidationDebounceMs?: number;
}>;

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
  const startWithPrefilled = useCallback(
    async (params: PrefillAddAddressParams): Promise<PrefillAddAddressStartResult> => {
      cancelAddressValidation();
      const existingAddressLabels = params.contact.addresses.map(address => address.label);
      const normalizedAddress = params.address.trim();
      const requestId = validationRequestId.current;

      if (normalizedAddress.length === 0) {
        setState(CLOSED_ADD_ADDRESS_FLOW_STATE);
        return { status: "invalid_address", error: "invalid_format" };
      }

      const validationResult = await requestAddressValidation(
        addressValidation,
        params.currency.currencyId,
        normalizedAddress,
      );

      if (validationRequestId.current !== requestId) {
        return { status: "cancelled" };
      }

      if (validationResult.status === "unavailable") {
        setState(CLOSED_ADD_ADDRESS_FLOW_STATE);
        return { status: "unavailable" };
      }

      if (validationResult.status !== "valid") {
        setState(CLOSED_ADD_ADDRESS_FLOW_STATE);
        return { status: "invalid_address", error: validationResult.status };
      }

      const addressEntry: ValidAddAddressEntryState = {
        status: "valid",
        value: normalizedAddress,
        resolvedAddress: validationResult.resolvedAddress,
        inputMethod: validationResult.isDomain ? "ens" : "manual",
      };

      setState({
        status: "namingAddress",
        selectedContactId: params.contact.id,
        existingAddressLabels,
        selectedCurrencyId: params.currency.currencyId,
        entryMode: "prefilled",
        displayContext: {
          assetDisplayName: params.currency.assetDisplayName,
          network: params.network,
        },
        addressEntry,
        addressLabel: createAddressLabelState(
          limitAddressLabelLength(params.currency.assetDisplayName),
          existingAddressLabels,
        ),
      });

      return { status: "started" };
    },
    [addressValidation, cancelAddressValidation],
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
          entryMode: "mad",
          displayContext: null,
          addressEntry: EMPTY_ADDRESS_ENTRY_STATE,
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
          applyAddressEntryState(currentState, selectedCurrencyId, EMPTY_ADDRESS_ENTRY_STATE),
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
        entryMode: currentState.entryMode,
        displayContext: currentState.displayContext,
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

      if (currentState.entryMode === "prefilled") {
        return {
          status: "reviewingAddress",
          selectedContactId: currentState.selectedContactId,
          existingAddressLabels: currentState.existingAddressLabels,
          selectedCurrencyId: currentState.selectedCurrencyId,
          entryMode: currentState.entryMode,
          displayContext: currentState.displayContext,
          addressEntry: currentState.addressEntry,
          addressLabel: currentState.addressLabel,
          origin: "addressName",
        };
      }

      return {
        status: "confirmationRequired",
        selectedContactId: currentState.selectedContactId,
        existingAddressLabels: currentState.existingAddressLabels,
        selectedCurrencyId: currentState.selectedCurrencyId,
        entryMode: currentState.entryMode,
        displayContext: currentState.displayContext,
        addressEntry: currentState.addressEntry,
        addressLabel: currentState.addressLabel,
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
        entryMode: currentState.entryMode,
        displayContext: currentState.displayContext,
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
  const completeConfirmation = useCallback(() => {
    setState(currentState =>
      currentState.status === "confirmationRequired"
        ? {
            ...currentState,
            status: "success",
            target: {
              type: "contactDetail",
              contactId: currentState.selectedContactId,
            },
          }
        : currentState,
    );
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
          if (currentState.entryMode === "prefilled") {
            return CLOSED_ADD_ADDRESS_FLOW_STATE;
          }
          return { ...currentState, status: "enteringAddress" };
        case "reviewingAddress": {
          if (currentState.entryMode === "prefilled") {
            const { origin, ...session } = currentState;
            return origin === "addressDetails"
              ? { ...session, status: "enteringAddress" }
              : { ...session, status: "namingAddress" };
          }
          const { origin, ...session } = currentState;
          return origin === "addressDetails"
            ? { ...session, status: "enteringAddress" }
            : { ...session, status: "namingAddress" };
        }
        case "confirmationRequired":
          return { ...currentState, status: "namingAddress" };
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
    startWithPrefilled,
    completeCurrencySelection,
    updateAddress,
    updateAddressLabel,
    confirmAddress,
    continueFromAddressDetails,
    continueFromName,
    continueFromReview,
    completeConfirmation,
    goBack,
    close,
  };
}
