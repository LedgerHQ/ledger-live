import type { SanctionedAddressBannerProps } from "../ContactsAddAddressEntry.types";
import type { AddAddressEntryState } from "../types";

export type AddressValidationLabels = Readonly<{
  validatingAddress: string;
  validAddress: string;
  invalidAddress: string;
  domainNotFound: string;
  sanctionedAddress: string;
  validationUnavailable: string;
}>;

export type AddressInputPresentation = Readonly<{
  inputStatus: "success" | "error" | undefined;
  helperText: string | undefined;
  showEnsDisclaimer: boolean;
}>;

export type AddressEntryPresentation = AddressInputPresentation &
  Readonly<{
    isConfirmEnabled: boolean;
  }>;

export function resolveAddressInputPresentation(
  addressEntry: AddAddressEntryState,
  labels: AddressValidationLabels,
): AddressInputPresentation {
  switch (addressEntry.status) {
    case "empty":
      return { inputStatus: undefined, helperText: undefined, showEnsDisclaimer: false };
    case "validating":
      return {
        inputStatus: undefined,
        helperText: labels.validatingAddress,
        showEnsDisclaimer: false,
      };
    case "valid":
      return {
        inputStatus: "success",
        helperText: labels.validAddress,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
      };
    case "invalid": {
      let helperText = labels.invalidAddress;
      if (addressEntry.error === "domain_not_found") {
        helperText = labels.domainNotFound;
      } else if (addressEntry.error === "sanctioned") {
        helperText = labels.sanctionedAddress;
      }

      return {
        inputStatus: "error",
        helperText,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
      };
    }
    case "unavailable":
      return {
        inputStatus: "error",
        helperText: labels.validationUnavailable,
        showEnsDisclaimer: false,
      };
  }
}

export function resolveAddressEntryPresentation(
  addressEntry: AddAddressEntryState,
  labels: AddressValidationLabels,
): AddressEntryPresentation {
  return {
    ...resolveAddressInputPresentation(addressEntry, labels),
    isConfirmEnabled: addressEntry.status === "valid",
  };
}

export function shouldShowSanctionedAddressBanner(
  addressEntry: AddAddressEntryState,
  sanctionedAddressBanner: SanctionedAddressBannerProps | undefined,
): boolean {
  return (
    addressEntry.status === "invalid" &&
    addressEntry.error === "sanctioned" &&
    sanctionedAddressBanner !== undefined
  );
}
