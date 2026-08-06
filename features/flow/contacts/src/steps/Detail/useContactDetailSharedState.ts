import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createContactDetailSharedState } from "./model/contactDetailSharedState";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useContactDetailSharedState(
  contactId: ContactId | undefined,
  formatMeDisplayName: (name: string) => string = name => name,
) {
  const contact = useSelector((state: ContactsStateRoot) =>
    contactId ? selectContactById(state, contactId) : undefined,
  );

  return useMemo(
    () => (contact ? createContactDetailSharedState(contact, formatMeDisplayName) : undefined),
    [contact, formatMeDisplayName],
  );
}
