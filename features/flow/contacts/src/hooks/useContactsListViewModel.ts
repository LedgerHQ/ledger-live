import { selectContacts } from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createContactsListViewModel } from "../list/viewModel";
import type { ContactsListViewModel } from "../list/types";
import { useContactsMeContact } from "./useContactsMeContact";

export function useContactsListViewModel(): ContactsListViewModel {
  const contacts = useSelector(selectContacts);
  const meContact = useContactsMeContact();

  return useMemo(() => createContactsListViewModel(meContact, contacts), [contacts, meContact]);
}
