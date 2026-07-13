import React from "react";
import { ContactsEmptyList, type ContactsEmptyListProps } from "@features/flow-contacts";

export type ContactsViewProps = ContactsEmptyListProps;

export function ContactsView(props: Readonly<ContactsViewProps>) {
  return <ContactsEmptyList {...props} />;
}
