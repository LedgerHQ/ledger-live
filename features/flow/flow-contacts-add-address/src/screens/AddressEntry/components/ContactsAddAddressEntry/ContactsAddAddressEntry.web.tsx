import React from "react";
import type {
  AddAddressEntryState,
  AddAddressInputSource,
  AddAddressLabelState,
} from "../../../../state/types";
import { ContactsAddAddressEntryView } from "../ContactsAddAddressEntryView/ContactsAddAddressEntryView";
import { useContactsAddAddressEntryViewModel } from "../../viewModel/useContactsAddAddressEntryViewModel";

export type AddressLabelConfiguration = Readonly<{
  addressLabel: AddAddressLabelState;
  onAddressLabelChange: (value: string) => void;
}>;

type WithoutAddressLabelConfiguration = Readonly<{
  addressLabel?: never;
  onAddressLabelChange?: never;
}>;

type ContactsAddAddressEntryWebBaseProps = Readonly<{
  addressEntry: AddAddressEntryState;
  supportsDomain: boolean;
  onSanctionedAddressLearnMore?: () => void;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onConfirm?: () => void;
  onQrCodeClick?: () => void;
}>;

export type ContactsAddAddressEntryWebProps =
  | (ContactsAddAddressEntryWebBaseProps & AddressLabelConfiguration)
  | (ContactsAddAddressEntryWebBaseProps & WithoutAddressLabelConfiguration);

export function ContactsAddAddressEntry(props: ContactsAddAddressEntryWebProps): React.JSX.Element {
  return <ContactsAddAddressEntryView {...useContactsAddAddressEntryViewModel(props)} />;
}
