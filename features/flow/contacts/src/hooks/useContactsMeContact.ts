import { contactsInitialState, selectMeContact } from "@domain/entity-contact";
import { useSelector } from "react-redux";

export function useContactsMeContact() {
  return useSelector(selectMeContact) ?? contactsInitialState.contacts[0];
}
