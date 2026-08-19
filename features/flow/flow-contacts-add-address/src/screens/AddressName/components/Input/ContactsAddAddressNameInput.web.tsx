import React from "react";
import type { ContactsAddAddressNameProps } from "../../types";
import { ContactsAddAddressNameView } from "../../ContactsAddAddressNameView";
import { useContactsAddAddressNameViewModel } from "../../useContactsAddAddressNameViewModel";

export type { ContactsAddAddressNameLabels, ContactsAddAddressNameProps } from "../../types";
export { ContactsAddAddressNameInput as ContactsAddAddressName };

export function ContactsAddAddressNameInput(props: ContactsAddAddressNameProps): React.JSX.Element {
  return <ContactsAddAddressNameView {...useContactsAddAddressNameViewModel(props)} />;
}
