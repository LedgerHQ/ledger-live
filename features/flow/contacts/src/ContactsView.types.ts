import type { ContactId } from "@domain/entity-contact";
import type { ContactsPageViewModel } from "@features/flow-contacts-list";
import type { ContactsLedgerSyncStatus } from "@features/flow-contacts-introduction";
import type { ContactDetailViewProps } from "@features/flow-contacts-detail";

export type ContactsViewProps = Readonly<{
  viewModel: ContactsPageViewModel;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenContact: (contactId: ContactId) => void;
  onAddContact: () => void;
  ledgerSyncStatus: ContactsLedgerSyncStatus;
  /** The selected contact, shown in the web side pane. Mobile opens the contact on its own screen, so the native view does not render it. */
  detail?: ContactDetailViewProps;
}>;
