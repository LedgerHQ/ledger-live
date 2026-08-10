import { useMemo } from "react";
import { useContacts } from "@features/platform-contacts";
import { createContactsListViewModel, createContactsSearchViewModel } from "../model/viewModel";
import type { ContactsListViewModel, ContactsSearchViewModel } from "../types";
import { useContactsMeContact } from "../../../hooks/useContactsMeContact";

export function useContactsSearchViewModel(
  query: string,
  formatMeDisplayName?: (name: string) => string,
): ContactsListViewModel | ContactsSearchViewModel {
  const contacts = useContacts();
  const meContact = useContactsMeContact();

  return useMemo(() => {
    if (query.trim().length === 0) {
      return createContactsListViewModel(meContact, contacts, formatMeDisplayName);
    }

    return createContactsSearchViewModel(meContact, contacts, query, formatMeDisplayName);
  }, [contacts, formatMeDisplayName, meContact, query]);
}
