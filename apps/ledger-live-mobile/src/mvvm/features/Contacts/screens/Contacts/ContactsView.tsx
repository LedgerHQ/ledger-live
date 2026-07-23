import React from "react";
import { ContactsPage } from "@features/flow-contacts";
import type { ContactsViewModel } from "./useContactsViewModel";

export function ContactsView(props: Readonly<ContactsViewModel>) {
  return <ContactsPage {...props} />;
}
