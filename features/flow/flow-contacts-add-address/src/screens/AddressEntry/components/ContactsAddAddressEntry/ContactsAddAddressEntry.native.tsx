import React from "react";
import { ContactsAddAddressEntryView } from "../ContactsAddAddressEntryView/ContactsAddAddressEntryView";
import type { ContactsAddAddressEntryProps } from "./ContactsAddAddressEntry.types";
import { useContactsAddAddressEntryViewModel } from "../../viewModel/useContactsAddAddressEntryViewModel";

export function ContactsAddAddressEntry(props: ContactsAddAddressEntryProps): React.JSX.Element {
  const viewModel = useContactsAddAddressEntryViewModel(props);

  return <ContactsAddAddressEntryView {...viewModel} />;
}
