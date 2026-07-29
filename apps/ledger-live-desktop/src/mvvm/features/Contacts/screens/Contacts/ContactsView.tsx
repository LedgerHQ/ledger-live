import React from "react";
import {
  ContactAddressDetailDialog,
  ContactsAddContactDialog,
  ContactsListView,
  type ContactAddressDetailDialogProps,
  type ContactsAddContactDialogProps,
  type ContactsListViewProps,
} from "@features/flow-contacts";

export type ContactsViewProps = ContactsListViewProps &
  Readonly<{
    addContactDialog: ContactsAddContactDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
  }>;

export function ContactsView({
  addContactDialog,
  addressDetailDialog,
  ...pageProps
}: Readonly<ContactsViewProps>) {
  return (
    <>
      <ContactsListView {...pageProps} />
      <ContactsAddContactDialog {...addContactDialog} />
      <ContactAddressDetailDialog {...addressDetailDialog} />
    </>
  );
}
