import { resolveAddressInputPresentation } from "@features/platform-contacts";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputPresentation,
  ContactsAddressValidationLabels,
} from "@features/platform-contacts";

export function resolveAddAddressEntryPresentation(
  addressEntry: ContactsAddressEntryState,
  labels: ContactsAddressValidationLabels,
): ContactsAddressInputPresentation & Readonly<{ isConfirmEnabled: boolean }> {
  return {
    ...resolveAddressInputPresentation(addressEntry, labels),
    isConfirmEnabled: addressEntry.status === "valid",
  };
}

export function shouldShowSanctionedAddressBanner(
  addressEntry: ContactsAddressEntryState,
  showLearnMore: boolean,
): boolean {
  return addressEntry.status === "invalid" && addressEntry.error === "sanctioned" && showLearnMore;
}
