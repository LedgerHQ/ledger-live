import React from "react";
import {
  ContactAddressDetailDialog,
  ContactsDeleteAddressDialog,
  ContactsDeleteContactDialog,
  ContactsEditSignerDialog,
  ContactsEditSignerMismatchDialog,
  ContactsView as ContactsFlowView,
  ContactsRenameAddressDialog,
  ContactsRenameContactDialog,
  type ContactAddressDetailDialogProps,
  type ContactsViewProps as ContactsFlowViewProps,
} from "@features/flow-contacts";
import {
  ContactsAddContactDialog,
  type ContactsAddContactDialogProps,
} from "@features/flow-contacts-add-contact";
import {
  ContactsAddAddressFlowDialog,
  type ContactsAddAddressFlowDialogProps,
} from "./components/ContactsAddAddressFlowDialog";
import type { ContactAddressDetailActionsDialogProps } from "./useContactAddressDetailActionsAdapter";
import type { ContactDetailEditDeleteDialogProps } from "./useContactDetailEditDeleteAdapter";

export type ContactsViewProps = ContactsFlowViewProps &
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
      <ContactsFlowView {...pageProps} />
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
