import type { AddContactAppAdapterResult, ContactsViewNativeProps } from "@features/flow-contacts";
import type { ContactsLedgerSyncIntroductionContentProps } from "@features/flow-contacts-introduction";

type ContactsLedgerSyncIntroductionPresentationProps = Pick<
  ContactsLedgerSyncIntroductionContentProps,
  "title" | "activateLabel" | "onActivate"
>;

export type ContactsPageViewModel = Omit<ContactsViewNativeProps, "onAddContact"> &
  Readonly<{
    ledgerSyncIntroductionContent: ContactsLedgerSyncIntroductionPresentationProps;
    onRequestAddContact: (onAllowed: () => void) => void;
  }>;

export type ContactsPageContentProps = ContactsPageViewModel &
  Pick<ContactsViewNativeProps, "onAddContact"> &
  Readonly<{
    addContactDrawer: AddContactAppAdapterResult;
  }>;
