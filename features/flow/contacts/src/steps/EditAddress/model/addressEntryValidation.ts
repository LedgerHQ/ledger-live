import type { ContactAddress } from "@domain/entity-contact";
import {
  applyAddressEntryIfCurrent,
  createValidatingAddressEntryState,
  EMPTY_ADDRESS_ENTRY_STATE,
  requestAddressValidation,
  resolveAddressEntryState,
} from "@features/platform-contacts";
import type { ContactsAddressEntryState } from "@features/platform-contacts";

export {
  applyAddressEntryIfCurrent as applyAddressEntryState,
  createValidatingAddressEntryState,
  requestAddressValidation,
  resolveAddressEntryState,
};

export const EMPTY_EDIT_ADDRESS_ENTRY_STATE = EMPTY_ADDRESS_ENTRY_STATE;

export function createInitialEditAddressEntryState(
  currentAddress: ContactAddress["address"],
): ContactsAddressEntryState {
  return {
    status: "valid",
    value: currentAddress,
    resolvedAddress: currentAddress,
    inputMethod: "manual",
  };
}

export function addressesMatch(value: string, currentAddress: ContactAddress["address"]): boolean {
  return value.trim().toLowerCase() === currentAddress.toLowerCase();
}
