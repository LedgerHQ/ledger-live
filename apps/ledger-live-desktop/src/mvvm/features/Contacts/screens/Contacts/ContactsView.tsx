import React from "react";
import {
  ContactAddressDetailDialog,
  ContactsDeleteAddressDialog,
  ContactsEditSignerDialog,
  ContactsEditSignerMismatchDialog,
  ContactsView as ContactsFlowView,
  type ContactAddressDetailDialogProps,
  type AddContactAppAdapterResult,
  type ContactsViewProps as ContactsFlowViewProps,
} from "@features/flow-contacts";
import { ContactsAddContactDialog } from "@features/flow-contacts-add-contact";
import { ContactsDeleteContactDialog } from "@features/flow-contacts-delete-contact";
import { ContactsRenameContactDialog } from "@features/flow-contacts-edit-contact";
import { ContactsRenameAddressDialog } from "@features/flow-contacts-edit-address";
import {
  ContactsAddAddressFlowDialog,
  type ContactsAddAddressFlowDialogProps,
} from "./components/ContactsAddAddressFlowDialog";
import type { ContactsDeviceIntentExecutorProps } from "@features/platform-contacts/device";
import { DeviceIntentExecutorLWD } from "LLD/components/DeviceIntentExecutor";
import type { ContactAddressDetailActionsDialogProps } from "./useContactAddressDetailActionsAdapter";
import type { ContactDetailEditDeleteDialogProps } from "./useContactDetailEditDeleteAdapter";

export type ContactsViewProps = ContactsFlowViewProps &
  Readonly<{
    addContactDialog: AddContactAppAdapterResult;
    addAddressFlowDialog: ContactsAddAddressFlowDialogProps;
    addressDetailDialog: ContactAddressDetailDialogProps;
    editDeleteDialogs: ContactDetailEditDeleteDialogProps;
    addressDetailActionsDialogs: ContactAddressDetailActionsDialogProps;
    dieProps: ContactsDeviceIntentExecutorProps | undefined;
  }>;

export function ContactsView({
  addContactDialog,
  addAddressFlowDialog,
  addressDetailDialog,
  editDeleteDialogs,
  addressDetailActionsDialogs,
  dieProps,
  ...pageProps
}: Readonly<ContactsViewProps>) {
  const areContactsDialogsHidden = dieProps?.enabled === true;

  return (
    <>
      <ContactsFlowView {...pageProps} />
      {areContactsDialogsHidden ? null : (
        <>
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
      )}
      {dieProps?.enabled === true ? (
        <DeviceIntentExecutorLWD sourceFlow="contacts" {...dieProps} />
      ) : null}
    </>
  );
}
