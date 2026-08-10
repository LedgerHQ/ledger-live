import type {
  ContactsLedgerSyncIntroductionContentProps,
  ContactsListViewNativeProps,
} from "@features/flow-contacts";
import type { ContactsAddContactDrawerProps } from "@features/flow-contacts-add-contact";

type ContactsLedgerSyncIntroductionPresentationProps = Pick<
  ContactsLedgerSyncIntroductionContentProps,
  "title" | "activateLabel" | "onActivate"
>;

export type ContactsPageViewModel = Omit<ContactsListViewNativeProps, "onAddContact"> &
  Readonly<{
    ledgerSyncIntroductionContent: ContactsLedgerSyncIntroductionPresentationProps;
  }>;

export type ContactsPageContentProps = ContactsPageViewModel &
  Pick<ContactsListViewNativeProps, "onAddContact"> &
  Readonly<{
    addContactDrawer: ContactsAddContactDrawerProps;
  }>;
