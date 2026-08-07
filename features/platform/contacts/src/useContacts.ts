import { selectContacts } from "@domain/entity-contact";
import { useSelector } from "react-redux";

export function useContacts() {
  return useSelector(selectContacts);
}
