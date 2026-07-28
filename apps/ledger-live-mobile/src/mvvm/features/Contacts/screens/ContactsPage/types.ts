import type {
  ContactsAddContactDrawerProps,
  ContactsLedgerSyncIntroductionContentProps,
  ContactsListViewNativeProps,
} from "@features/flow-contacts";

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
