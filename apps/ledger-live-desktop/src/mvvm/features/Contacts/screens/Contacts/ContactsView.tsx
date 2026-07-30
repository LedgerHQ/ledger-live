import React from "react";
import {
  ContactAddressDetailDialog,
  ContactsAddContactDialog,
  ContactsListView,
  type ContactAddressDetailDialogProps,
  type ContactsAddContactDialogProps,
  type ContactsListViewProps,
} from "@features/flow-contacts";
import {
  ContactsAddAddressFlowDialog,
  type ContactsAddAddressFlowDialogProps,
} from "./components/ContactsAddAddressFlowDialog";

export type ContactsViewProps = ContactsListViewProps &
  Readonly<{
    addContactDialog: ContactsAddContactDialogProps;
    addAddressFlowDialog: ContactsAddAddressFlowDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
  }>;

export function ContactsView({
  addContactDialog,
  addAddressFlowDialog,
  addressDetailDialog,
  ...pageProps
}: Readonly<ContactsViewProps>) {
  return (
    <>
      <ContactsListView {...pageProps} />
      <ContactsAddContactDialog {...addContactDialog} />
      <ContactAddressDetailDialog {...addressDetailDialog} />
      <ContactsAddAddressFlowDialog {...addAddressFlowDialog} />
    </>
  );
}
