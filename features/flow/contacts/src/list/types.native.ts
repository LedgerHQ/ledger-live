import type {
  ContactsListViewModel,
  ContactsPageLabels,
  ContactsPageProps,
  ContactsSearchViewModel,
} from "./types";

export type ContactsPageNativeLabels = ContactsPageLabels &
  Readonly<{
    searchNoResults: string;
  }>;

export type ContactsPageNativeProps = Omit<ContactsPageProps, "viewModel" | "labels"> &
  Readonly<{
    viewModel: ContactsListViewModel | ContactsSearchViewModel;
    labels: ContactsPageNativeLabels;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
  }>;
