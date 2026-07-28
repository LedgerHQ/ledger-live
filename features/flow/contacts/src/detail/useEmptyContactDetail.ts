import {
  selectContactById,
  type Contact,
  type ContactId,
} from "@domain/entity-contact";
import { useSelector } from "react-redux";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useEmptyContactDetail(
  contactId: ContactId
): Contact | undefined {
  const contact = useSelector((state: ContactsStateRoot) =>
    selectContactById(state, contactId)
  );

  return contact?.addresses.length === 0 ? contact : undefined;
}
