import type { MatchedContact } from "../types";
import { addressesMatch } from "./addressesMatch";
import { resolveRecipientNetworkId } from "./resolveRecipientNetworkId";

export type Contact = Readonly<{
  id: string;
  isMe: boolean;
  name: string;
  addresses: readonly ContactAddress[];
}>;

type ContactAddress = Readonly<{
  id: string;
  currencyId: string;
  label: string;
  address: string;
}>;

export function findMatchedContact(
  contacts: readonly Contact[],
  recipient: string,
  currencyId: string,
  resolvedRecipient?: string,
): MatchedContact | undefined {
  const recipientAddress = resolvedRecipient ?? recipient;
  const recipientNetworkId = resolveRecipientNetworkId(currencyId);
  if (!recipientAddress.trim()) {
    return undefined;
  }

  const sortedContacts = [...contacts].sort(
    (left, right) => Number(left.isMe) - Number(right.isMe),
  );

  for (const contact of sortedContacts) {
    if (!Array.isArray(contact.addresses)) {
      continue;
    }

    for (const address of contact.addresses) {
      if (
        resolveRecipientNetworkId(address.currencyId) === recipientNetworkId &&
        addressesMatch(address.address, recipientAddress)
      ) {
        return {
          contactId: contact.id,
          contactName: contact.name,
          addressId: address.id,
          addressLabel: address.label,
          address: address.address,
        };
      }
    }
  }

  return undefined;
}
