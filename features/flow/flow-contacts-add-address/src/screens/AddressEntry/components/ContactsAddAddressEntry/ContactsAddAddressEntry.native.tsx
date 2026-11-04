import React from "react";
import type { AddAddressEntryState, AddAddressInputSource } from "../../../../state/types";
import { ContactsAddAddressEntryView } from "../ContactsAddAddressEntryView/ContactsAddAddressEntryView";
import { useContactsAddAddressEntryViewModel } from "../../viewModel/useContactsAddAddressEntryViewModel";

export type ContactsAddAddressEntryProps = Readonly<{
  addressEntry: AddAddressEntryState;
  supportsDomain: boolean;
  onSanctionedAddressLearnMore?: () => void;
  bottomOffset?: number;
  onChangeText: (value: string, inputMethod: AddAddressInputSource) => void;
  onConfirm: () => void;
  onQrCodeClick?: () => void;
}>;

export function ContactsAddAddressEntry(props: ContactsAddAddressEntryProps): React.JSX.Element {
  const viewModel = useContactsAddAddressEntryViewModel(props);

  return <ContactsAddAddressEntryView {...viewModel} />;
}
