import React from "react";
import { ContactsPageContent } from "@features/flow-contacts/components/ContactsPage";
import type { ContactsViewModel } from "./useContactsViewModel";

export function ContactsView(props: Readonly<ContactsViewModel>) {
  return <ContactsPageContent {...props} />;
}
