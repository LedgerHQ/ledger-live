import type { ChangeEvent } from "react";
import type { ContactId } from "@domain/entity-contact";
import type {
  ContactsFeatureIntroduction,
  ContactsLedgerSyncIntroduction,
  ContactsLedgerSyncStatus,
} from "../Introduction/types";

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

export type ContactsPageViewModel = ContactsListViewModel | ContactsSearchViewModel;

export type ContactsListViewLabels = Readonly<{
  title: string;
  searchPlaceholder: string;
  searchNoResults: string;
  addContact: string;
  ledgerSyncCheckingAccessibilityLabel?: string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactsPageSharedProps = Readonly<{
  viewModel: ContactsPageViewModel;
  labels: ContactsListViewLabels;
  searchQuery: string;
  meAvatarSrc: string;
  onOpenContact: (contactId: ContactId) => void;
  onAddContact: () => void;
  ledgerSyncStatus: ContactsLedgerSyncStatus;
  featureIntroduction: ContactsFeatureIntroduction;
  ledgerSyncIntroduction: ContactsLedgerSyncIntroduction;
}>;

export type ContactsListViewProps = ContactsPageSharedProps &
  Readonly<{
    onSearchInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onOpenMe: (contactId: ContactId) => void;
  }>;

export type ContactsListViewNativeProps = ContactsPageSharedProps &
  Readonly<{
    onSearchQueryChange: (query: string) => void;
  }>;

export function isPopulatedContactsListViewModel(
  viewModel: ContactsPageViewModel,
): viewModel is PopulatedContactsListViewModel | ContactsSearchResultsViewModel {
  return viewModel.displayMode === "populated";
}

export function isContactsSearchNoResultsViewModel(
  viewModel: ContactsPageViewModel,
): viewModel is ContactsSearchNoResultsViewModel {
  return "status" in viewModel && viewModel.status === "no-results";
}
