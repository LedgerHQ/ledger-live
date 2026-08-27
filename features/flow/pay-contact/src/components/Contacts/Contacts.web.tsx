import React from "react";
import { ContactsView } from "./ContactsView.web";
import { useContactsViewModel } from "./useContactsViewModel";
import type { ContactsProps } from "../../types";

export function Contacts(props: ContactsProps) {
  const { isEmpty } = useContactsViewModel();

  return <ContactsView {...props} isEmpty={isEmpty} />;
}
