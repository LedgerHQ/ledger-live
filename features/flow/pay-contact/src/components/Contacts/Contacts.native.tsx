import React from "react";
import type { Contact } from "@domain/entity-contact";
import type { OutgoingOperation } from "@features/platform-contacts";
import { ContactsView } from "./ContactsView";
import { useContactsViewModel } from "./useContactsViewModel";

export type ContactsNativeProps = Readonly<{
  onPay: () => void;
  onContactPress?: (contact: Contact) => void;
  onSeeAll: () => void;
  outgoingOperations?: readonly OutgoingOperation[];
}>;

export function Contacts(props: ContactsNativeProps): React.JSX.Element {
  const viewModel = useContactsViewModel(props);

  return <ContactsView {...viewModel} />;
}
