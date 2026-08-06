import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createContactDetailSharedState } from "./model/contactDetailSharedState";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useContactDetailSharedState(
  contactId: ContactId | undefined,
  formatMeDisplayName?: (name: string) => string,
) {
  const contact = useSelector((state: ContactsStateRoot) =>
    contactId ? selectContactById(state, contactId) : undefined,
  );
  const formatName = formatMeDisplayName ?? (name => name);

  return useMemo(
    () => (contact ? createContactDetailSharedState(contact, formatName) : undefined),
    [contact, formatName],
  );
}
