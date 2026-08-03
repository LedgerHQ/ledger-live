import { useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import type {
  AddressLabelConfiguration,
  ContactsAddAddressEntryWebProps,
  ContactsAddAddressEntryWebViewProps,
} from "./ContactsAddAddressEntry.web.types";

function getAddressLabelConfiguration({
  addressLabel,
  nameLabels,
  onAddressLabelChange,
}: Partial<AddressLabelConfiguration>): AddressLabelConfiguration | undefined {
  return addressLabel && nameLabels && onAddressLabelChange
    ? { addressLabel, nameLabels, onAddressLabelChange }
    : undefined;
}

function getPastedValue(value: string, event: ClipboardEvent<HTMLInputElement>): string {
  const input = event.currentTarget;
  const pastedText = event.clipboardData.getData("text");
  const selectionStart = input.selectionStart ?? value.length;
  const selectionEnd = input.selectionEnd ?? value.length;

  return `${value.slice(0, selectionStart)}${pastedText}${value.slice(selectionEnd)}`;
}

function resolveAddressInputPresentation(
  addressEntry: ContactsAddAddressEntryWebProps["addressEntry"],
  labels: ContactsAddAddressEntryWebProps["labels"],
): Pick<
  ContactsAddAddressEntryWebViewProps,
  "inputStatus" | "helperText" | "showEnsDisclaimer" | "isConfirmEnabled"
> {
  switch (addressEntry.status) {
    case "empty":
      return { showEnsDisclaimer: false, isConfirmEnabled: false };
    case "validating":
      return {
        helperText: labels.validatingAddress,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
    case "valid":
      return {
        inputStatus: "success",
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
        inputStatus: "error",
        helperText,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
        isConfirmEnabled: false,
      };
    }
    case "unavailable":
      return {
        inputStatus: "error",
        helperText: labels.validationUnavailable,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
  }
}

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  labels,
  onAddressChange,
  onConfirm,
  ...addressLabelProps
}: ContactsAddAddressEntryWebProps): ContactsAddAddressEntryWebViewProps {
  const addressLabelConfiguration = getAddressLabelConfiguration(addressLabelProps);
  const presentation = useMemo(
    () => resolveAddressInputPresentation(addressEntry, labels),
    [addressEntry, labels],
  );
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onAddressChange(event.target.value, "manual"),
    [onAddressChange],
  );
  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      onAddressChange(getPastedValue(addressEntry.value, event), "paste");
    },
    [addressEntry.value, onAddressChange],
  );
  const onNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      addressLabelConfiguration?.onAddressLabelChange(event.target.value),
    [addressLabelConfiguration],
  );
  const nameValidationMessage = useMemo(
    () =>
      addressLabelConfiguration?.addressLabel.validationError
        ? addressLabelConfiguration.nameLabels.validationErrors[
            addressLabelConfiguration.addressLabel.validationError
          ]
        : undefined,
    [addressLabelConfiguration],
  );
  const isNameValid =
    addressLabelConfiguration === undefined ||
    addressLabelConfiguration.addressLabel.status === "valid";

  const addressLabelViewProps = addressLabelConfiguration
    ? {
        addressLabel: addressLabelConfiguration.addressLabel,
        nameLabels: addressLabelConfiguration.nameLabels,
        nameValidationMessage,
        onAddressLabelChange: onNameChange,
      }
    : {};

  return {
    value: addressEntry.value,
    labels,
    ...presentation,
    ...addressLabelViewProps,
    isConfirmEnabled: presentation.isConfirmEnabled && isNameValid && onConfirm !== undefined,
    onChange,
    onPaste,
    onConfirm,
  };
}
