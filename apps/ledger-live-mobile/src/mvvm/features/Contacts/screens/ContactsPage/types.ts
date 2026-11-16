import type { AddContactAppAdapterResult, ContactsViewProps } from "@features/flow-contacts";
import type {
  ContactsFeatureIntroduction,
  ContactsLedgerSyncIntroduction,
} from "@features/flow-contacts-introduction";
import type { ContactsLedgerSyncActivationDrawerProps } from "../../components/ContactsLedgerSyncActivationDrawer";

export type ContactsPageViewModel = Omit<ContactsViewProps, "onAddContact"> &
  Readonly<{
    featureIntroduction: ContactsFeatureIntroduction;
    ledgerSyncIntroduction: ContactsLedgerSyncIntroduction;
    ledgerSyncActivationDrawer: ContactsLedgerSyncActivationDrawerProps;
    onRequestAddContact: (onAllowed: () => void) => void;
  }>;

export type ContactsPageContentProps = ContactsPageViewModel &
  Pick<ContactsViewProps, "onAddContact"> &
  Readonly<{
    addContactDrawer: AddContactAppAdapterResult;
  }>;
