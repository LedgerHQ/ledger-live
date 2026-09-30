import { useMemo } from "react";
import { useContacts, useContactsMeContact } from "@features/platform-contacts";
import { createContactsListViewModel } from "../model/viewModel";
import type { ContactsListViewModel } from "../types";

export function useContactsListViewModel(): ContactsListViewModel {
  const meContact = useContactsMeContact();
  const contacts = useContacts();

  return useMemo(() => createContactsListViewModel(meContact, contacts), [contacts, meContact]);
}
