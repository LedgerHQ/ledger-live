export {
  createContactsSearchViewModel,
  createContactsListViewModel,
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "./model/viewModel";
export { useContactsListViewModel } from "./hooks/useContactsListViewModel";
export { useContactsSearchViewModel } from "./hooks/useContactsSearchViewModel";
export type {
  ContactsListViewLabels,
  ContactsListViewProps,
  ContactsPageViewModel,
  ContactsSearchNoResultsViewModel,
  ContactsSearchResultsViewModel,
  ContactsSearchViewModel,
  ContactsListItem,
  ContactsListSection,
  ContactsListViewModel,
  EmptyContactsListViewModel,
  PopulatedContactsListViewModel,
} from "./types";
export { isContactsSearchNoResultsViewModel, isPopulatedContactsListViewModel } from "./types";
