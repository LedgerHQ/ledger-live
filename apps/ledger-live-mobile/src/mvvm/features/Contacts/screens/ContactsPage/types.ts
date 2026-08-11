import type {
  ContactsLedgerSyncIntroductionContentProps,
  ContactsViewNativeProps,
} from "@features/flow-contacts";
import type { ContactsAddContactDrawerProps } from "@features/flow-contacts-add-contact";

type ContactsLedgerSyncIntroductionPresentationProps = Pick<
  ContactsLedgerSyncIntroductionContentProps,
  "title" | "activateLabel" | "onActivate"
>;

export type ContactsPageViewModel = Omit<ContactsViewNativeProps, "onAddContact"> &
  Readonly<{
    ledgerSyncIntroductionContent: ContactsLedgerSyncIntroductionPresentationProps;
  }>;

export type ContactsPageContentProps = ContactsPageViewModel &
  Pick<ContactsViewNativeProps, "onAddContact"> &
  Readonly<{
    addContactDrawer: ContactsAddContactDrawerProps;
  }>;
