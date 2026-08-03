import React from "react";
import type { ContactsAddAddressNameProps } from "./types";
import { ContactsAddAddressNameView } from "./ContactsAddAddressNameView.web";
import { useContactsAddAddressNameViewModel } from "./useContactsAddAddressNameViewModel.web";

export function ContactsAddAddressName(props: ContactsAddAddressNameProps): React.JSX.Element {
  return <ContactsAddAddressNameView {...useContactsAddAddressNameViewModel(props)} />;
}
