import { useCallback, useEffect, useRef, useState } from "react";
import type { ContactAddress } from "@domain/entity-contact";
import { addressesMatch, wait } from "@features/platform-contacts";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputSource,
  ContactsAddressValidationPort,
  OtherContactAddress,
} from "@features/platform-contacts";
import {
  applyAddressEntryState,
  createInitialEditAddressEntryState,
  createValidatingAddressEntryState,
  EMPTY_EDIT_ADDRESS_ENTRY_STATE,
  requestAddressValidation,
  resolveAddressEntryState,
} from "./model/addressEntryValidation";

const UNAVAILABLE_ADDRESS_VALIDATION: ContactsAddressValidationPort = {
  validateAddress: async () => ({ status: "unavailable" }),
};

export type UseEditAddressAddressEntryOptions = Readonly<{
  addressValidation?: ContactsAddressValidationPort;
  currencyId: ContactAddress["currencyId"] | undefined;
  currentAddress: ContactAddress["address"] | undefined;
  contactId?: string;
  isActive: boolean;
  manualValidationDebounceMs?: number;
  otherContactsAddresses?: readonly OtherContactAddress[];
}>;

export type UseEditAddressAddressEntryResult = Readonly<{
  addressEntry: ContactsAddressEntryState;
  onAddressChange: (value: string, inputMethod: ContactsAddressInputSource) => void;
}>;

export function useEditAddressAddressEntry({
  addressValidation = UNAVAILABLE_ADDRESS_VALIDATION,
  currencyId,
  currentAddress,
  contactId,
  isActive,
  manualValidationDebounceMs = 0,
  otherContactsAddresses = [],
}: UseEditAddressAddressEntryOptions): UseEditAddressAddressEntryResult {
  const [addressEntry, setAddressEntry] = useState<ContactsAddressEntryState>(() =>
    currentAddress === undefined
      ? EMPTY_EDIT_ADDRESS_ENTRY_STATE
      : createInitialEditAddressEntryState(currentAddress),
  );
  const validationRequestId = useRef(0);
  const wasActiveRef = useRef(false);
  const hasInitializedRef = useRef(currentAddress !== undefined);

  useEffect(() => {
    const didOpen = isActive && !wasActiveRef.current;

    if (didOpen) {
      hasInitializedRef.current = false;
      setAddressEntry(
        currentAddress !== undefined
          ? createInitialEditAddressEntryState(currentAddress)
          : EMPTY_EDIT_ADDRESS_ENTRY_STATE,
      );
      validationRequestId.current += 1;
      if (currentAddress !== undefined) {
        hasInitializedRef.current = true;
      }
    } else if (isActive && !hasInitializedRef.current && currentAddress !== undefined) {
      setAddressEntry(createInitialEditAddressEntryState(currentAddress));
      validationRequestId.current += 1;
      hasInitializedRef.current = true;
    }

    if (!isActive) {
      hasInitializedRef.current = false;
    }

    wasActiveRef.current = isActive;
  }, [currentAddress, isActive]);

  useEffect(
    () => () => {
      validationRequestId.current += 1;
    },
    [],
  );

  const onAddressChange = useCallback(
    (value: string, inputMethod: ContactsAddressInputSource) => {
      const normalizedAddress = value.trim();
      const requestId = validationRequestId.current + 1;
      validationRequestId.current = requestId;

      if (normalizedAddress.length === 0) {
        setAddressEntry(EMPTY_EDIT_ADDRESS_ENTRY_STATE);
        return;
      }

      if (currentAddress !== undefined && addressesMatch(normalizedAddress, currentAddress)) {
        setAddressEntry(createInitialEditAddressEntryState(currentAddress));
        return;
      }

      if (currencyId === undefined) {
        setAddressEntry({
          status: "unavailable",
          value,
          resolvedAddress: null,
          inputMethod,
        });
        return;
      }

      setAddressEntry(createValidatingAddressEntryState(value, inputMethod));

      void (async () => {
        if (inputMethod === "manual" && manualValidationDebounceMs > 0) {
          await wait(manualValidationDebounceMs);
          if (validationRequestId.current !== requestId) {
            return;
          }
        }

        const validationResult = await requestAddressValidation(
          addressValidation,
          currencyId,
          normalizedAddress,
        );

        if (validationRequestId.current !== requestId) {
          return;
        }

        let finalEntry = resolveAddressEntryState(value, inputMethod, validationResult);
        if (finalEntry.status === "valid") {
          const resolvedAddress = finalEntry.resolvedAddress;
          const dup =
            otherContactsAddresses.find(
              other =>
                (contactId === undefined || other.contactId !== contactId) &&
                addressesMatch(other.address, resolvedAddress),
            )?.contactName ?? null;
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

        setAddressEntry(currentEntry => applyAddressEntryState(currentEntry, finalEntry, value));
      })();
    },
    [
      addressValidation,
      contactId,
      currencyId,
      currentAddress,
      manualValidationDebounceMs,
      otherContactsAddresses,
    ],
  );

  return { addressEntry, onAddressChange };
}
