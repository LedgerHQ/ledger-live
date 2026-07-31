import React from "react";
import type { ContactsAddAddressEntryWebProps } from "../ContactsAddAddressEntry.web.types";
import { ContactsAddAddressEntryView } from "../ContactsAddAddressEntryView.web";
import { useContactsAddAddressEntryViewModel } from "./useContactsAddAddressEntryViewModel.web";

export function ContactsAddAddressEntry(props: ContactsAddAddressEntryWebProps): React.JSX.Element {
  return <ContactsAddAddressEntryView {...useContactsAddAddressEntryViewModel(props)} />;
}
