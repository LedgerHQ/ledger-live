import { hasEnsDisclaimer } from "./state";
import type { ContactsAddressEntryState } from "./types";

export type ContactsAddressValidationLabels = Readonly<{
  validatingAddress: string;
  validAddress: string;
  invalidAddress: string;
  domainNotFound: string;
  sanctionedAddress: string;
  validationUnavailable: string;
  duplicateAddress: (contactName: string) => string;
}>;

export type ContactsAddressInputPresentation = Readonly<{
  inputStatus: "success" | "error" | undefined;
  helperText: string | undefined;
  showEnsDisclaimer: boolean;
}>;

export function resolveAddressInputPresentation(
  addressEntry: ContactsAddressEntryState,
  labels: ContactsAddressValidationLabels,
): ContactsAddressInputPresentation {
  const showEnsDisclaimer = hasEnsDisclaimer(addressEntry);

  switch (addressEntry.status) {
    case "empty":
      return { inputStatus: undefined, helperText: undefined, showEnsDisclaimer: false };
    case "validating":
      return {
        inputStatus: undefined,
        helperText: labels.validatingAddress,
        showEnsDisclaimer,
      };
    case "valid":
      return {
        inputStatus: "success",
        helperText: labels.validAddress,
        showEnsDisclaimer,
      };
    case "invalid": {
      let helperText = labels.invalidAddress;
      if (addressEntry.error === "domain_not_found") {
        helperText = labels.domainNotFound;
      } else if (addressEntry.error === "sanctioned") {
        helperText = labels.sanctionedAddress;
      } else if (addressEntry.error === "duplicate_address") {
        helperText = labels.duplicateAddress(addressEntry.contactName);
      }

      return {
        inputStatus: "error",
        helperText,
        showEnsDisclaimer,
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
