import {
  selectContactById,
  type Contact,
  type ContactId,
} from "@domain/entity-contact";
import { useSelector } from "react-redux";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useEmptyContactDetail(
  contactId: ContactId | undefined,
): Contact | undefined {
  const contact = useSelector((state: ContactsStateRoot) =>
    contactId ? selectContactById(state, contactId) : undefined,
  );

  return contact?.addresses.length === 0 ? contact : undefined;
}
