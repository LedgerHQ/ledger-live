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
  isMe: boolean;
}>;

export type RecipientHeaderPresentation = Readonly<{
  /** Address, domain or account the user entered; never a contact name. */
  recipientDisplayValue: string;
  /** Matched contact with its raw name: render it through the contacts display name rule. */
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
      ? findMatchedContact(contacts, address, currencyId, undefined, {
          preferredContactId: recipient?.contactId,
        })
      : undefined;

  const recipientDisplayValue = getRecipientDisplayValue(recipient);

  if (!matchedContact) {
    return { recipientDisplayValue, contact: undefined };
  }

  return {
    recipientDisplayValue,
    contact: {
      id: matchedContact.contactId,
      name: matchedContact.contactName,
      isMe: matchedContact.isMe,
    },
  };
}
