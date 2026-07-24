import { useMemo } from "react";
import { createContactsListViewModel, createContactsSearchViewModel } from "../list/viewModel";
import type { ContactsListViewModel, ContactsSearchViewModel } from "../list/types";
import { useContacts } from "./useContacts";
import { useContactsMeContact } from "./useContactsMeContact";

export function useContactsSearchViewModel(
  query: string,
): ContactsListViewModel | ContactsSearchViewModel {
  const contacts = useContacts();
  const meContact = useContactsMeContact();

  return useMemo(() => {
    if (query.trim().length === 0) {
      return createContactsListViewModel(meContact, contacts);
    }

    return createContactsSearchViewModel(meContact, contacts, query);
  }, [contacts, meContact, query]);
}
