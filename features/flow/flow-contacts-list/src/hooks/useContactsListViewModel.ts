import { useMemo } from "react";
import {
  useContactDisplayName,
  useContacts,
  useContactsMeContact,
} from "@features/platform-contacts";
import { createContactsListViewModel } from "../model/viewModel";
import type { ContactsListViewModel } from "../types";

export function useContactsListViewModel(): ContactsListViewModel {
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const getDisplayName = useContactDisplayName();

  return useMemo(
    () => createContactsListViewModel(meContact, contacts, getDisplayName),
    [contacts, getDisplayName, meContact],
  );
}
