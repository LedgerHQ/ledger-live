import { useMemo } from "react";
import {
  useContactDisplayName,
  useContacts,
  useContactsMeContact,
} from "@features/platform-contacts";
import { createContactsListViewModel, createContactsSearchViewModel } from "../model/viewModel";
import type { ContactsListViewModel, ContactsSearchViewModel } from "../types";

export function useContactsSearchViewModel(
  query: string,
): ContactsListViewModel | ContactsSearchViewModel {
  const contacts = useContacts();
  const meContact = useContactsMeContact();
  const getDisplayName = useContactDisplayName();

  return useMemo(() => {
    if (query.trim().length === 0) {
      return createContactsListViewModel(meContact, contacts);
    }

    return createContactsSearchViewModel(meContact, contacts, query, getDisplayName);
  }, [contacts, getDisplayName, meContact, query]);
}
