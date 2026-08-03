import React from "react";
import {
  ContactAddressDetailDialog,
  ContactsAddContactDialog,
  ContactsDeleteContactDialog,
  ContactsEditSignerDialog,
  ContactsListView,
  ContactsRenameContactDialog,
  type ContactAddressDetailDialogProps,
  type ContactsAddContactDialogProps,
  type ContactsListViewProps,
} from "@features/flow-contacts";
import {
  ContactsAddAddressFlowDialog,
  type ContactsAddAddressFlowDialogProps,
} from "./components/ContactsAddAddressFlowDialog";
import type { ContactDetailEditDeleteDialogProps } from "./useContactDetailEditDeleteAdapter";

export type ContactsViewProps = ContactsListViewProps &
  Readonly<{
    addContactDialog: ContactsAddContactDialogProps;
    addAddressFlowDialog: ContactsAddAddressFlowDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
    editDeleteDialogs: ContactDetailEditDeleteDialogProps;
  }>;

export function ContactsView({
  addContactDialog,
  addAddressFlowDialog,
  addressDetailDialog,
  editDeleteDialogs,
  ...pageProps
}: Readonly<ContactsViewProps>) {
  return (
    <>
      <ContactsListView {...pageProps} />
      <ContactsAddContactDialog {...addContactDialog} />
      <ContactAddressDetailDialog {...addressDetailDialog} />
      <ContactsAddAddressFlowDialog {...addAddressFlowDialog} />
      <ContactsRenameContactDialog {...editDeleteDialogs.renameDialog} />
      <ContactsDeleteContactDialog {...editDeleteDialogs.deleteDialog} />
      <ContactsEditSignerDialog {...editDeleteDialogs.signerDialog} />
    </>
  );
}
