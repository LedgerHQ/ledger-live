import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ContactId } from "@domain/entity-contact";
import {
  addressesMatch,
  createValidatingAddressEntryState,
  EMPTY_ADDRESS_ENTRY_STATE,
  requestAddressValidation,
  resolveAddressEntryState,
  wait,
} from "@features/platform-contacts";
import type { ContactsAddressValidationPort } from "@features/platform-contacts";
import { addAddressFlowReducer, CLOSED_ADD_ADDRESS_FLOW_STATE } from "./addAddressFlowReducer";
import type {
  AddAddressContact,
  AddAddressCurrencySelection,
  AddAddressFlowState,
  AddAddressFlowViewModel,
  AddAddressInputSource,
  OtherContactAddress,
  PrefillAddAddressParams,
  PrefillAddAddressStartResult,
} from "./types";

function findDuplicateContactName(
  resolvedAddress: string,
  otherContactsAddresses: readonly OtherContactAddress[],
  excludeContactId: string,
): string | null {
  return (
    otherContactsAddresses.find(
      other =>
        other.contactId !== excludeContactId && addressesMatch(other.address, resolvedAddress),
    )?.contactName ?? null
  );
}

const UNAVAILABLE_ADDRESS_VALIDATION: ContactsAddressValidationPort = {
  validateAddress: async () => ({ status: "unavailable" }),
};

export type UseAddAddressFlowViewModelOptions = Readonly<{
  addressValidation?: ContactsAddressValidationPort;
  manualValidationDebounceMs?: number;
  otherContactsAddresses?: readonly OtherContactAddress[];
}>;

export function useAddAddressFlowViewModel({
  addressValidation = UNAVAILABLE_ADDRESS_VALIDATION,
  manualValidationDebounceMs = 0,
  otherContactsAddresses = [],
}: UseAddAddressFlowViewModelOptions = {}): AddAddressFlowViewModel {
  const [state, dispatch] = useReducer(addAddressFlowReducer, CLOSED_ADD_ADDRESS_FLOW_STATE);
  const stateRef = useRef<AddAddressFlowState>(state);
  const validationRequestId = useRef(0);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const cancelAddressValidation = useCallback(() => {
    validationRequestId.current += 1;
  }, []);
  const start = useCallback(
    (contact: AddAddressContact) => {
      cancelAddressValidation();
      dispatch({ type: "start", contact });
    },
    [cancelAddressValidation],
  );
  const startWithPrefilled = useCallback(
    async (params: PrefillAddAddressParams): Promise<PrefillAddAddressStartResult> => {
      cancelAddressValidation();
      const normalizedAddress = params.address.trim();
      const requestId = validationRequestId.current;

      if (normalizedAddress.length === 0) {
        dispatch({ type: "close" });
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
        dispatch({ type: "close" });
        return { status: "unavailable" };
      }

      if (validationResult.status !== "valid") {
        dispatch({ type: "close" });
        return { status: "invalid_address", error: validationResult.status };
      }

      const duplicateName = findDuplicateContactName(
        validationResult.resolvedAddress,
        otherContactsAddresses,
        params.contact.id,
      );
      if (duplicateName !== null) {
        dispatch({ type: "close" });
        return { status: "duplicate_address", contactName: duplicateName };
      }

      dispatch({
        type: "startWithPrefilled",
        params,
        addressEntry: {
          status: "valid",
          value: normalizedAddress,
          resolvedAddress: validationResult.resolvedAddress,
          inputMethod: validationResult.isDomain ? "ens" : "manual",
        },
      });

      return { status: "started" };
    },
    [addressValidation, cancelAddressValidation, otherContactsAddresses],
  );
  const completeCurrencySelection = useCallback(
    (contactId: ContactId, selection: AddAddressCurrencySelection) => {
      dispatch({ type: "completeCurrencySelection", contactId, selection });
    },
    [],
  );
  const updateAddress = useCallback(
    async (value: string, inputMethod: AddAddressInputSource) => {
      const currentState = stateRef.current;
      if (currentState.status !== "enteringAddress") {
        return;
      }

      const normalizedAddress = value.trim();
      const { selectedCurrencyId, selectedContactId } = currentState;
      const requestId = validationRequestId.current + 1;
      validationRequestId.current = requestId;

      if (normalizedAddress.length === 0) {
        dispatch({
          type: "updateAddressEntry",
          selectedCurrencyId,
          addressEntry: EMPTY_ADDRESS_ENTRY_STATE,
        });
        return;
      }

      dispatch({
        type: "updateAddressEntry",
        selectedCurrencyId,
        addressEntry: createValidatingAddressEntryState(value, inputMethod),
      });

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

      let finalEntry = resolveAddressEntryState(value, inputMethod, validationResult);
      if (finalEntry.status === "valid") {
        const dup = findDuplicateContactName(
          finalEntry.resolvedAddress,
          otherContactsAddresses,
          selectedContactId,
        );
        if (dup !== null) {
          finalEntry = {
            status: "invalid",
            value,
            resolvedAddress: null,
            inputMethod: finalEntry.inputMethod,
            error: "duplicate_address",
            contactName: dup,
          };
        }
      }

      dispatch({
        type: "updateAddressEntry",
        selectedCurrencyId,
        addressEntry: finalEntry,
        expectedValue: value,
      });
    },
    [addressValidation, manualValidationDebounceMs, otherContactsAddresses],
  );
  const updateAddressLabel = useCallback((value: string) => {
    dispatch({ type: "updateAddressLabel", value });
  }, []);
  const confirmAddress = useCallback(() => {
    cancelAddressValidation();
    dispatch({ type: "confirmAddress" });
  }, [cancelAddressValidation]);
  const continueFromName = useCallback(() => {
    dispatch({ type: "continueFromName" });
  }, []);
  const continueFromAddressDetails = useCallback(() => {
    cancelAddressValidation();
    dispatch({ type: "continueFromAddressDetails" });
  }, [cancelAddressValidation]);
  const continueFromReview = useCallback(() => {
    dispatch({ type: "continueFromReview" });
  }, []);
  const completeConfirmation = useCallback(() => {
    dispatch({ type: "completeConfirmation" });
  }, []);
  const goBack = useCallback(() => {
    cancelAddressValidation();
    dispatch({ type: "goBack" });
  }, [cancelAddressValidation]);
  const close = useCallback(() => {
    cancelAddressValidation();
    dispatch({ type: "close" });
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
