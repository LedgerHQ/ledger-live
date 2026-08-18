import { useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import { getPastedValue } from "../../utils/getPastedValue.web";
import {
  resolveAddressEntryPresentation,
  shouldShowSanctionedAddressBanner,
} from "./model/addressInputPresentation";
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

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  labels,
  sanctionedAddressBanner,
  onAddressChange,
  onConfirm,
  ...addressLabelProps
}: ContactsAddAddressEntryWebProps): ContactsAddAddressEntryWebViewProps {
  const addressLabelConfiguration = getAddressLabelConfiguration(addressLabelProps);
  const presentation = useMemo(
    () => resolveAddressEntryPresentation(addressEntry, labels),
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
  const showSanctionedAddressBanner = shouldShowSanctionedAddressBanner(
    addressEntry,
    sanctionedAddressBanner,
  );

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
    sanctionedAddressBanner: showSanctionedAddressBanner ? sanctionedAddressBanner : undefined,
    ...addressLabelViewProps,
    isConfirmEnabled: presentation.isConfirmEnabled && isNameValid && onConfirm !== undefined,
    onChange,
    onPaste,
    onConfirm,
  };
}
