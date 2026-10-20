import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { findMatchedContact } from "@ledgerhq/live-common/flows/send/recipient/utils/findMatchedContact";
import { ContactIdSchema, selectContacts, type ContactId } from "@domain/entity-contact";
import {
  isContactsEnabledForCurrency,
  useContactDisplayName,
  useContactsFeature,
} from "@features/platform-contacts";

export type OperationDetailsContact = Readonly<{
  name: string;
  contactId: ContactId;
  rawName: string;
  isMe: boolean;
}>;

export function useOperationDetailsContactViewModel(
  address: string,
  currencyId: string | undefined,
): OperationDetailsContact | undefined {
  const contactsConfig = useContactsFeature("desktop");
  const contacts = useSelector(selectContacts);
  const getDisplayName = useContactDisplayName();

  return useMemo(() => {
    if (!currencyId || !address || !isContactsEnabledForCurrency(contactsConfig, currencyId)) {
      return undefined;
    }

    const match = findMatchedContact(contacts, address, currencyId);
    if (!match) return undefined;

    const parsedId = ContactIdSchema.safeParse(match.contactId);
    if (!parsedId.success) return undefined;

    return {
      name: getDisplayName({ name: match.contactName, isMe: match.isMe }),
      contactId: parsedId.data,
      rawName: match.contactName,
      isMe: match.isMe,
    };
  }, [contactsConfig, currencyId, address, contacts, getDisplayName]);
}
