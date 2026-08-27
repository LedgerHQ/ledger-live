import React from "react";
import { ContactsView } from "./ContactsView.web";
import { useContactsViewModel } from "./useContactsViewModel";
import type { ContactsProps } from "../../types";

export function Contacts(props: ContactsProps) {
  const viewModel = useContactsViewModel(props);

  return <ContactsView {...viewModel} />;
}
