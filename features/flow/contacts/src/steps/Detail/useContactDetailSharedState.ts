import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useContactDisplayName } from "@features/platform-contacts";
import { createContactDetailSharedState } from "./model/contactDetailSharedState";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useContactDetailSharedState(contactId: ContactId | undefined) {
  const contact = useSelector((state: ContactsStateRoot) =>
    contactId ? selectContactById(state, contactId) : undefined,
  );
  const getDisplayName = useContactDisplayName();

  return useMemo(
    () => (contact ? createContactDetailSharedState(contact, getDisplayName) : undefined),
    [contact, getDisplayName],
  );
}
