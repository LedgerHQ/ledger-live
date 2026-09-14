import type { ContactAddress } from "@domain/entity-contact";
import type { ContactsAddressEntryState } from "@features/platform-contacts";

export {
  applyAddressEntryIfCurrent as applyAddressEntryState,
  createValidatingAddressEntryState,
  requestAddressValidation,
  resolveAddressEntryState,
  EMPTY_ADDRESS_ENTRY_STATE as EMPTY_EDIT_ADDRESS_ENTRY_STATE,
} from "@features/platform-contacts";

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
