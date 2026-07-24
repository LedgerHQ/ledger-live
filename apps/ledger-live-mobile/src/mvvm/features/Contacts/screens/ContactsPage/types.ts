import type {
  ContactsAddContactDrawerProps,
  ContactsLedgerSyncIntroductionContentProps,
  ContactsPageNativeProps,
} from "@features/flow-contacts";

type ContactsLedgerSyncIntroductionPresentationProps = Pick<
  ContactsLedgerSyncIntroductionContentProps,
  "title" | "activateLabel" | "onActivate"
>;

export type ContactsPageViewModel = Omit<ContactsPageNativeProps, "onAddContact"> &
  Readonly<{
    ledgerSyncIntroductionContent: ContactsLedgerSyncIntroductionPresentationProps;
  }>;

export type ContactsPageContentProps = ContactsPageViewModel &
  Pick<ContactsPageNativeProps, "onAddContact"> &
  Readonly<{
    addContactDrawer: ContactsAddContactDrawerProps;
  }>;
