import { resolveAddressInputPresentation } from "@features/platform-contacts";
import type {
  ContactsAddressEntryState,
  ContactsAddressInputPresentation,
  ContactsAddressValidationLabels,
} from "@features/platform-contacts";
import type { SanctionedAddressBannerProps } from "../screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.types";

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
  sanctionedAddressBanner: SanctionedAddressBannerProps | undefined,
): boolean {
  return (
    addressEntry.status === "invalid" &&
    addressEntry.error === "sanctioned" &&
    sanctionedAddressBanner !== undefined
  );
}
