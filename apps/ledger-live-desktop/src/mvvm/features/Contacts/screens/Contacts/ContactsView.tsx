import React from "react";
import {
  ContactsAddContactDialog,
  ContactsPage,
  type ContactsAddContactDialogProps,
  type ContactsPageProps,
} from "@features/flow-contacts";

export type ContactsViewProps = ContactsPageProps &
  Readonly<{
    addContactDialog: ContactsAddContactDialogProps;
  }>;

export function ContactsView({ addContactDialog, ...pageProps }: Readonly<ContactsViewProps>) {
  return (
    <>
      <ContactsPage {...pageProps} />
      <ContactsAddContactDialog {...addContactDialog} />
    </>
  );
}
