import { useMemo } from "react";
import { useContacts } from "@features/platform-contacts";
import { createContactsListViewModel } from "../model/viewModel";
import type { ContactsListViewModel } from "../types";
import { useContactsMeContact } from "../../../hooks/useContactsMeContact";

export function useContactsListViewModel(): ContactsListViewModel {
  const meContact = useContactsMeContact();
  const contacts = useContacts();

  return useMemo(() => createContactsListViewModel(meContact, contacts), [contacts, meContact]);
}
