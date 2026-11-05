import React from "react";
import {
  ContactsView as ContactsFlowView,
  type AddContactAppAdapterResult,
  type ContactsViewProps as ContactsFlowViewProps,
} from "@features/flow-contacts";
import type {
  ContactsFeatureIntroduction,
  ContactsLedgerSyncIntroduction,
} from "@features/flow-contacts-introduction";
import {
  ContactsFeatureIntroductionDialog,
  ContactsLedgerSyncIntroductionDialog,
} from "@features/flow-contacts-introduction/web";
import {
  ContactAddressDetailDialog,
  ContactsEditSignerMismatchDialog,
  type ContactAddressDetailDialogProps,
} from "@features/flow-contacts-detail";
import { ContactsAddContactDialog } from "@features/flow-contacts-add-contact/web";
import { ContactsDeleteContactDialog } from "@features/flow-contacts-delete-contact";
import { ContactsRenameContactDialog } from "@features/flow-contacts-edit-contact";
import { ContactsDeleteAddressDialog } from "@features/flow-contacts-delete-address";
import { ContactsRenameAddressDialog } from "@features/flow-contacts-edit-address";
import {
  ContactsAddAddressFlowDialog,
  type ContactsAddAddressFlowDialogProps,
} from "./components/ContactsAddAddressFlowDialog";
import type { ContactsDeviceIntentExecutorProps } from "@features/platform-contacts/device";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import type { ContactAddressDetailActionsDialogProps } from "./useContactAddressDetailActionsAdapter";
import type { ContactDetailEditDeleteDialogProps } from "./useContactDetailEditDeleteAdapter";

export type ContactsViewProps = ContactsFlowViewProps &
  Readonly<{
    featureIntroduction: ContactsFeatureIntroduction;
    ledgerSyncIntroduction: ContactsLedgerSyncIntroduction;
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
  featureIntroduction,
  ledgerSyncIntroduction,
  ledgerSyncStatus,
  ...pageProps
}: Readonly<ContactsViewProps>) {
  const areContactsDialogsHidden = dieProps?.enabled === true;

  return (
    <>
      <ContactsFlowView {...pageProps} ledgerSyncStatus={ledgerSyncStatus} />
      <ContactsFeatureIntroductionDialog {...featureIntroduction} />
      <ContactsLedgerSyncIntroductionDialog
        open={ledgerSyncIntroduction.isOpen}
        onActivate={ledgerSyncIntroduction.onActivate}
        onDismiss={ledgerSyncIntroduction.onDismiss}
      />
      {areContactsDialogsHidden ? null : (
        <>
          <ContactsAddContactDialog {...addContactDialog} />
          <ContactAddressDetailDialog {...addressDetailDialog} />
          <ContactsAddAddressFlowDialog {...addAddressFlowDialog} />
          <ContactsRenameContactDialog {...editDeleteDialogs.renameDialog} />
          <ContactsDeleteContactDialog {...editDeleteDialogs.deleteDialog} />
          <ContactsEditSignerMismatchDialog {...editDeleteDialogs.signerMismatchDialog} />
          <ContactsDeleteAddressDialog {...addressDetailActionsDialogs.deleteDialog} />
          <ContactsRenameAddressDialog {...addressDetailActionsDialogs.renameDialog} />
          <ContactsEditSignerMismatchDialog {...addressDetailActionsDialogs.signerMismatchDialog} />
        </>
      )}
      {dieProps?.enabled === true ? (
        <DeviceIntentExecutor sourceFlow="contacts" {...dieProps} />
      ) : null}
    </>
  );
}
