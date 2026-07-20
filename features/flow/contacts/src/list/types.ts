import type { ContactId } from "@domain/entity-contact";

export type ContactsListItem = Readonly<{
  contactId: ContactId;
  name: string;
  initial: string;
  addressCount: number;
}>;

export type ContactsListSection = Readonly<{
  title: string;
  data: readonly ContactsListItem[];
}>;

export type EmptyContactsListViewModel = Readonly<{
  displayMode: "empty";
  me: ContactsListItem;
}>;

export type PopulatedContactsListViewModel = Readonly<{
  displayMode: "populated";
  me: ContactsListItem;
  savedContacts: readonly ContactsListItem[];
  sections: readonly ContactsListSection[];
}>;

export type ContactsListViewModel = EmptyContactsListViewModel | PopulatedContactsListViewModel;

export type ContactsPageLabels = Readonly<{
  title: string;
  searchPlaceholder: string;
  addContact: string;
  ledgerSyncCheckingAccessibilityLabel?: string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactsLedgerSyncStatus = "ready" | "checking" | "inactive";

export type ContactsLedgerSyncIntroduction = Readonly<{
  isOpen: boolean;
  description: string;
  dismissLabel: string;
  onDismiss: () => void;
}>;

export type ContactsPageProps = Readonly<{
  viewModel: ContactsListViewModel;
  labels: ContactsPageLabels;
  meAvatarSrc: string;
  onOpenContact: (contactId: ContactId) => void;
  onAddContact: () => void;
  ledgerSyncStatus: ContactsLedgerSyncStatus;
  ledgerSyncIntroduction: ContactsLedgerSyncIntroduction;
}>;

export function isPopulatedContactsListViewModel(
  viewModel: ContactsListViewModel,
): viewModel is PopulatedContactsListViewModel {
  return viewModel.displayMode === "populated";
}

export type ContactsSearchResultsViewModel = Readonly<{
  displayMode: "populated";
  status: "results";
  me?: ContactsListItem;
  savedContacts: readonly ContactsListItem[];
  sections: readonly ContactsListSection[];
}>;

export type ContactsSearchNoResultsViewModel = Readonly<{
  displayMode: "empty";
  status: "no-results";
}>;

export type ContactsSearchViewModel =
  | ContactsSearchResultsViewModel
  | ContactsSearchNoResultsViewModel;
