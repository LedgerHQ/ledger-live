import React from "react";
import {
  ContactAddressDetailDialog,
  ContactsAddContactDialog,
  ContactsDeleteAddressDialog,
  ContactsDeleteContactDialog,
  ContactsEditSignerDialog,
  ContactsEditSignerMismatchDialog,
  ContactsListView,
  ContactsRenameAddressDialog,
  ContactsRenameContactDialog,
  type ContactAddressDetailDialogProps,
  type ContactsAddContactDialogProps,
  type ContactsListViewProps,
} from "@features/flow-contacts";
import {
  ContactsAddAddressFlowDialog,
  type ContactsAddAddressFlowDialogProps,
} from "./components/ContactsAddAddressFlowDialog";
import type { ContactAddressDetailActionsDialogProps } from "./useContactAddressDetailActionsAdapter";
import type { ContactDetailEditDeleteDialogProps } from "./useContactDetailEditDeleteAdapter";

export type ContactsViewProps = ContactsListViewProps &
  Readonly<{
    addContactDialog: ContactsAddContactDialogProps;
    addAddressFlowDialog: ContactsAddAddressFlowDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
    editDeleteDialogs: ContactDetailEditDeleteDialogProps;
    addressDetailActionsDialogs: ContactAddressDetailActionsDialogProps;
  }>;

export function ContactsView({
  addContactDialog,
  addAddressFlowDialog,
  addressDetailDialog,
  editDeleteDialogs,
  addressDetailActionsDialogs,
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
      <ContactsDeleteAddressDialog {...addressDetailActionsDialogs.deleteDialog} />
      <ContactsRenameAddressDialog {...addressDetailActionsDialogs.renameDialog} />
      <ContactsEditSignerDialog {...addressDetailActionsDialogs.signerDialog} />
      <ContactsEditSignerMismatchDialog {...addressDetailActionsDialogs.signerMismatchDialog} />
    </>
  );
}
