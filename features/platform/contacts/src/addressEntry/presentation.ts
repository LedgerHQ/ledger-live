import type { ContactsAddressEntryState } from "./types";

export type ContactsAddressValidationLabels = Readonly<{
  validatingAddress: string;
  validAddress: string;
  invalidAddress: string;
  domainNotFound: string;
  sanctionedAddress: string;
  validationUnavailable: string;
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
