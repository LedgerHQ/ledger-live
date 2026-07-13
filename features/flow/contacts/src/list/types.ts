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

export type ContactsEmptyListLabels = Readonly<{
  title: string;
  searchPlaceholder: string;
  addContact: string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactsEmptyListProps = Readonly<{
  viewModel: EmptyContactsListViewModel;
  labels: ContactsEmptyListLabels;
  meAvatarSrc: string;
  onOpenMe: (contactId: ContactId) => void;
  onAddContact: () => void;
}>;
