import React from "react";
import type { ContactsAddAddressEntryWebProps } from "./ContactsAddAddressEntry.types";
import { ContactsAddAddressEntryView } from "../ContactsAddAddressEntryView/ContactsAddAddressEntryView";
import { useContactsAddAddressEntryViewModel } from "../../viewModel/useContactsAddAddressEntryViewModel";

export type { ContactsAddAddressEntryWebProps } from "./ContactsAddAddressEntry.types";

export function ContactsAddAddressEntry(props: ContactsAddAddressEntryWebProps): React.JSX.Element {
  return <ContactsAddAddressEntryView {...useContactsAddAddressEntryViewModel(props)} />;
}
