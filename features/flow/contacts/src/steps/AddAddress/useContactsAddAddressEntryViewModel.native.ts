import { useCallback } from "react";
import type {
  ContactsAddAddressEntryProps,
  ContactsAddAddressEntryViewProps,
} from "./ContactsAddAddressEntry.types";
import type { AddAddressEntryLabels, AddAddressEntryState } from "./types";

type AddressInputPresentation = Readonly<{
  status?: "error" | "success";
  helperText?: string;
  showEnsDisclaimer: boolean;
  isConfirmEnabled: boolean;
}>;

function getInsertedCharacterCount(previousValue: string, nextValue: string): number {
  // Native only exposes the full next value, so isolate the changed middle section to detect paste.
  let prefixLength = 0;
  while (
    prefixLength < previousValue.length &&
    prefixLength < nextValue.length &&
    previousValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < previousValue.length - prefixLength &&
    suffixLength < nextValue.length - prefixLength &&
    previousValue[previousValue.length - 1 - suffixLength] ===
      nextValue[nextValue.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  return nextValue.length - prefixLength - suffixLength;
}

function resolveAddressInputPresentation(
  addressEntry: AddAddressEntryState,
  labels: AddAddressEntryLabels,
): AddressInputPresentation {
  switch (addressEntry.status) {
    case "empty":
      return {
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
    case "validating":
      return {
        helperText: labels.validatingAddress,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
    case "valid":
      return {
        status: "success",
        helperText: labels.validAddress,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
        isConfirmEnabled: true,
      };
    case "invalid": {
      let helperText = labels.invalidAddress;
      if (addressEntry.error === "domain_not_found") {
        helperText = labels.domainNotFound;
      } else if (addressEntry.error === "sanctioned") {
        helperText = labels.sanctionedAddress;
      }

      return {
        status: "error",
        helperText,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
        isConfirmEnabled: false,
      };
    }
    case "unavailable":
      return {
        status: "error",
        helperText: labels.validationUnavailable,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
  }
}

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  labels,
  sanctionedBanner,
  bottomOffset = 0,
  onChangeText,
  onConfirm,
  onQrCodeClick,
}: ContactsAddAddressEntryProps): ContactsAddAddressEntryViewProps {
  const presentation = resolveAddressInputPresentation(addressEntry, labels);
  const onAddressChange = useCallback(
    (value: string) => {
      const inputMethod =
        getInsertedCharacterCount(addressEntry.value, value) > 1 ? "paste" : "manual";
      onChangeText(value, inputMethod);
    },
    [addressEntry.value, onChangeText],
  );

  const shouldShowSanctionedBanner =
    addressEntry.status === "invalid" && addressEntry.error === "sanctioned" && sanctionedBanner;

  return {
    value: addressEntry.value,
    labels,
    bottomOffset,
    bottomPadding: 32,
    inputStatus: presentation.status,
    helperText: shouldShowSanctionedBanner ? undefined : presentation.helperText,
    ...(shouldShowSanctionedBanner ? { sanctionedBanner } : {}),
    showEnsDisclaimer: presentation.showEnsDisclaimer,
    isConfirmEnabled: presentation.isConfirmEnabled,
    onAddressChange,
    onConfirm,
    onQrCodeClick,
  };
}
