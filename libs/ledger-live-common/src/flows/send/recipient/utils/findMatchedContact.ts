import type { MatchedContact } from "../types";
import { addressesMatch } from "./addressesMatch";

type Contact = Readonly<{
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

function resolveNetworkId(currencyId: string): string {
  return currencyId.split("/")[0];
}

export function findMatchedContact(
  contacts: readonly Contact[],
  recipient: string,
  currencyId: string,
  resolvedRecipient?: string,
): MatchedContact | undefined {
  const recipientAddress = resolvedRecipient ?? recipient;
  const recipientNetworkId = resolveNetworkId(currencyId);
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
        resolveNetworkId(address.currencyId) === recipientNetworkId &&
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
