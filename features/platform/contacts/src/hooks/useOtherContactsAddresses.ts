import type { ContactId } from "@domain/entity-contact";
import { useMemo } from "react";
import type { OtherContactAddress } from "../addressEntry/types";
import { useContacts } from "../useContacts";
import { useContactDisplayName } from "./useContactDisplayName";

/** Every saved address with its owner's display name, for duplicate-address validation. */
export function useOtherContactsAddresses(
  excludeContactId?: ContactId,
): readonly OtherContactAddress[] {
  const contacts = useContacts();
  const getDisplayName = useContactDisplayName();

  return useMemo(
    () =>
      contacts
        .filter(contact => contact.id !== excludeContactId)
        .flatMap(contact =>
          contact.addresses.map(address => ({
            contactId: contact.id,
            contactName: getDisplayName(contact),
            address: address.address,
          })),
        ),
    [contacts, excludeContactId, getDisplayName],
  );
}
