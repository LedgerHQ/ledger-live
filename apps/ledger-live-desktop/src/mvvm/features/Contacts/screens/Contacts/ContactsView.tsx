import React from "react";
import { ContactsPage, type ContactsPageWebProps } from "@features/flow-contacts";

export type ContactsViewProps = ContactsPageWebProps;

export function ContactsView(props: Readonly<ContactsViewProps>) {
  return <ContactsPage {...props} />;
}
