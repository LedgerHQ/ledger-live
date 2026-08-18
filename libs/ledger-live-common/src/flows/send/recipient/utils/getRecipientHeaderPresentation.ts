import type { RecipientData } from "../../types";
import { getRecipientDisplayValue } from "../../utils";
import { type Contact, findMatchedContact } from "./findMatchedContact";

type GetRecipientHeaderPresentationArgs = Readonly<{
  recipient: RecipientData | null;
  contacts: readonly Contact[];
  currencyId: string | undefined;
  isContactsFeatureEnabled: boolean;
}>;

export type RecipientHeaderContact = Readonly<{
  id: string;
  name: string;
}>;

export type RecipientHeaderPresentation = Readonly<{
  label: string;
  contact: RecipientHeaderContact | undefined;
}>;

export function getRecipientHeaderPresentation({
  recipient,
  contacts,
  currencyId,
  isContactsFeatureEnabled,
}: GetRecipientHeaderPresentationArgs): RecipientHeaderPresentation {
  const address = recipient?.address;
  const matchedContact =
    isContactsFeatureEnabled && address && currencyId
      ? findMatchedContact(contacts, address, currencyId)
      : undefined;

  if (!matchedContact) {
    return { label: getRecipientDisplayValue(recipient), contact: undefined };
  }

  return {
    label: matchedContact.contactName,
    contact: {
      id: matchedContact.contactId,
      name: matchedContact.contactName,
    },
  };
}
