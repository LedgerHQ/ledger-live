import React from "react";
import { ContactsPage, type ContactsPageProps } from "@features/flow-contacts";

export type ContactsViewProps = ContactsPageProps;

export function ContactsView(props: Readonly<ContactsViewProps>) {
  return <ContactsPage {...props} />;
}
