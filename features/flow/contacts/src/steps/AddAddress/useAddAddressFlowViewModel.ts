import { useCallback, useEffect, useRef, useState } from "react";
import type { ContactAddress, ContactId } from "@domain/entity-contact";
import type { ContactsAddressValidationPort, ContactsAddressValidationResult } from "./model/ports";
import type {
  AddAddressEntryState,
  AddAddressFlowState,
  AddAddressFlowViewModel,
  AddAddressInputSource,
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
      return {
        status: "invalid",
        value,
        resolvedAddress: null,
        inputMethod:
          result.status === "domain_not_found" ||
          (result.status === "invalid_format" && result.isDomain)
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
    (selectedContactId: ContactId) => {
      cancelAddressValidation();
      setState({
        status: "selectingCurrency",
        selectedContactId,
      });
    },
    [cancelAddressValidation],
  );
  const completeCurrencySelection = useCallback(
    (selectedContactId: ContactId, selectedCurrencyId: ContactAddress["currencyId"]) => {
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
          selectedCurrencyId,
          addressEntry: EMPTY_ADD_ADDRESS_ENTRY_STATE,
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
        selectedCurrencyId: currentState.selectedCurrencyId,
        addressEntry: currentState.addressEntry,
      };
    });
  }, [cancelAddressValidation]);
  const continueFromName = useCallback(() => {
    setState(currentState =>
      currentState.status === "namingAddress"
        ? { ...currentState, status: "reviewingAddress" }
        : currentState,
    );
  }, []);
  const continueFromReview = useCallback(() => {
    setState(currentState =>
      currentState.status === "reviewingAddress"
        ? { ...currentState, status: "success" }
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
          };
        case "namingAddress":
          return { ...currentState, status: "enteringAddress" };
        case "reviewingAddress":
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
    completeCurrencySelection,
    updateAddress,
    confirmAddress,
    continueFromName,
    continueFromReview,
    goBack,
    close,
  };
}
