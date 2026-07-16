import type { ContactId } from "@domain/entity-contact";

export type ContactsListItem = Readonly<{
  contactId: ContactId;
  name: string;
  initial: string;
  addressCount: number;
}>;

export type EmptyContactsListViewModel = Readonly<{
  me: ContactsListItem;
}>;

export type ContactsPageLabels = Readonly<{
  title: string;
  searchPlaceholder: string;
  addContact: string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactsPageProps = Readonly<{
  viewModel: EmptyContactsListViewModel;
  labels: ContactsPageLabels;
  meAvatarSrc: string;
  onOpenMe: (contactId: ContactId) => void;
  onAddContact: () => void;
}>;
