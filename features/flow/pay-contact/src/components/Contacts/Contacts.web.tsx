import React, { type ReactNode } from "react";
import type { Contact } from "@domain/entity-contact";
import type { ContactOperation } from "@features/platform-contacts";
import { ContactsView } from "./ContactsView";
import { useContactsViewModel } from "./useContactsViewModel";
import type { PayAddContactProps } from "../../types";

export type ContactsProps = Readonly<{
  addContact: PayAddContactProps;
  renderAddresses: (addresses: Contact["addresses"]) => ReactNode;
  onContactPress?: (contact: Contact) => void;
  onViewContact?: (contact: Contact) => void;
  onViewTransactions?: (contact: Contact) => void;
  operations?: readonly ContactOperation[];
}>;

export function Contacts(props: ContactsProps) {
  const viewModel = useContactsViewModel(props);

  return <ContactsView {...viewModel} />;
}
