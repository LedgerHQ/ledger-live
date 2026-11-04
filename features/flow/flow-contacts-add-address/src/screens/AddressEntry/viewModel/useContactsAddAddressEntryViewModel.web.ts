import { useCallback, useMemo, type ChangeEvent, type ClipboardEvent } from "react";
import { getPastedValue } from "@features/platform-contacts/web";
import { useAddAddressEntryCopy } from "../../../copy/useAddAddressEntryCopy";
import { useAddAddressNameLabels } from "../../../copy/useAddAddressNameLabels";
import {
  resolveAddAddressEntryPresentation,
  shouldShowSanctionedAddressBanner,
} from "../../../state/addAddressEntryPresentation";
import type {
  AddressLabelConfiguration,
  ContactsAddAddressEntryWebProps,
} from "../components/ContactsAddAddressEntry/ContactsAddAddressEntry";
import type { ContactsAddAddressEntryWebViewProps } from "../components/ContactsAddAddressEntryView/ContactsAddAddressEntryView";

function getAddressLabelConfiguration({
  addressLabel,
  onAddressLabelChange,
}: Partial<AddressLabelConfiguration>): AddressLabelConfiguration | undefined {
  return addressLabel && onAddressLabelChange ? { addressLabel, onAddressLabelChange } : undefined;
}

export function useContactsAddAddressEntryViewModel({
  addressEntry,
  supportsDomain,
  onSanctionedAddressLearnMore,
  onAddressChange,
  onConfirm,
  onQrCodeClick,
  ...addressLabelProps
}: ContactsAddAddressEntryWebProps): ContactsAddAddressEntryWebViewProps {
  const { labels, sanctionedDescription, sanctionedLearnMore } =
    useAddAddressEntryCopy(supportsDomain);
  const nameLabels = useAddAddressNameLabels();
  const addressLabelConfiguration = getAddressLabelConfiguration(addressLabelProps);
  const presentation = useMemo(
    () => resolveAddAddressEntryPresentation(addressEntry, labels),
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
        ? nameLabels.validationErrors[addressLabelConfiguration.addressLabel.validationError]
        : undefined,
    [addressLabelConfiguration, nameLabels.validationErrors],
  );
  const isNameValid =
    addressLabelConfiguration === undefined ||
    addressLabelConfiguration.addressLabel.status === "valid";
  const showSanctionedAddressBanner = shouldShowSanctionedAddressBanner(
    addressEntry,
    onSanctionedAddressLearnMore !== undefined,
  );

  const addressLabelViewProps = addressLabelConfiguration
    ? {
        addressLabel: addressLabelConfiguration.addressLabel,
        nameLabels,
        nameValidationMessage,
        onAddressLabelChange: onNameChange,
      }
    : {};

  return {
    value: addressEntry.value,
    labels,
    ...presentation,
    sanctionedAddressBanner:
      showSanctionedAddressBanner && onSanctionedAddressLearnMore
        ? {
            description: sanctionedDescription,
            actionLabel: sanctionedLearnMore,
            onAction: onSanctionedAddressLearnMore,
          }
        : undefined,
    ...addressLabelViewProps,
    isConfirmEnabled: presentation.isConfirmEnabled && isNameValid && onConfirm !== undefined,
    onChange,
    onPaste,
    onConfirm,
    onQrCodeClick,
  };
}
