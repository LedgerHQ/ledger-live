import React from "react";
import { ContactsAddAddressEntryView } from "./ContactsAddAddressEntryView.native";
import type { ContactsAddAddressEntryProps } from "./ContactsAddAddressEntry.types";
import { useContactsAddAddressEntryViewModel } from "./useContactsAddAddressEntryViewModel.native";

export function ContactsAddAddressEntry(props: ContactsAddAddressEntryProps): React.JSX.Element {
  const viewModel = useContactsAddAddressEntryViewModel(props);

  return <ContactsAddAddressEntryView {...viewModel} />;
}
