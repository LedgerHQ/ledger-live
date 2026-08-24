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
  type AddContactAppAdapterResult,
  type ContactsViewProps as ContactsFlowViewProps,
} from "@features/flow-contacts";
import { ContactsAddContactDialog } from "./components/ContactsAddContactDialog";
import {
  ContactsAddAddressFlowDialog,
  type ContactsAddAddressFlowDialogProps,
} from "./components/ContactsAddAddressFlowDialog";
import type { ContactAddressDetailActionsDialogProps } from "./useContactAddressDetailActionsAdapter";
import type { ContactDetailEditDeleteDialogProps } from "./useContactDetailEditDeleteAdapter";

export type ContactsViewProps = ContactsFlowViewProps &
  Readonly<{
    addContactDialog: AddContactAppAdapterResult;
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
      <ContactsEditSignerMismatchDialog {...editDeleteDialogs.signerMismatchDialog} />
      <ContactsDeleteAddressDialog {...addressDetailActionsDialogs.deleteDialog} />
      <ContactsRenameAddressDialog {...addressDetailActionsDialogs.renameDialog} />
      <ContactsEditSignerDialog {...addressDetailActionsDialogs.signerDialog} />
      <ContactsEditSignerMismatchDialog {...addressDetailActionsDialogs.signerMismatchDialog} />
    </>
  );
}
