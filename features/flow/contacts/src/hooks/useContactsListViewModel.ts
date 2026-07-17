import { useMemo } from "react";
import { createContactsListViewModel } from "../list/viewModel";
import type { ContactsListViewModel } from "../list/types";
import { useContacts } from "./useContacts";
import { useContactsMeContact } from "./useContactsMeContact";

export function useContactsListViewModel(): ContactsListViewModel {
  const meContact = useContactsMeContact();
  const contacts = useContacts();

  return useMemo(
    () => createContactsListViewModel(meContact, contacts),
    [contacts, meContact],
  );
}
