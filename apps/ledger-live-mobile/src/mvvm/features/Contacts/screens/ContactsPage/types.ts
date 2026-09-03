import type { AddContactAppAdapterResult, ContactsViewNativeProps } from "@features/flow-contacts";
import type { ContactsLedgerSyncActivationDrawerProps } from "../../components/ContactsLedgerSyncActivationDrawer";

export type ContactsPageViewModel = Omit<ContactsViewNativeProps, "onAddContact"> &
  Readonly<{
    ledgerSyncActivationDrawer: ContactsLedgerSyncActivationDrawerProps;
    onRequestAddContact: (onAllowed: () => void) => void;
  }>;

export type ContactsPageContentProps = ContactsPageViewModel &
  Pick<ContactsViewNativeProps, "onAddContact"> &
  Readonly<{
    addContactDrawer: AddContactAppAdapterResult;
  }>;
