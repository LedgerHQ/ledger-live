import React from "react";
import {
  ContactsAddContactDialog,
  ContactsListView,
  type ContactsAddContactDialogProps,
  type ContactsListViewProps,
} from "@features/flow-contacts";

export type ContactsViewProps = ContactsListViewProps &
  Readonly<{
    addContactDialog: ContactsAddContactDialogProps;
  }>;

export function ContactsView({ addContactDialog, ...pageProps }: Readonly<ContactsViewProps>) {
  return (
    <>
      <ContactsListView {...pageProps} />
      <ContactsAddContactDialog {...addContactDialog} />
    </>
  );
}
