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

type FindMatchedContactOptions = Readonly<{
  matchName?: boolean;
}>;

export function findMatchedContact(
  contacts: readonly Contact[],
  recipient: string,
  currencyId: string,
  resolvedRecipient?: string,
  options?: FindMatchedContactOptions,
): MatchedContact | undefined {
  const recipientAddress = resolvedRecipient ?? recipient;
  const recipientNetworkId = resolveRecipientNetworkId(currencyId);
  const normalizedRecipient = recipient.trim().toLowerCase();
  if (!normalizedRecipient) {
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

  if (!options?.matchName || resolvedRecipient) {
    return undefined;
  }

  for (const contact of sortedContacts) {
    if (
      contact.name.trim().toLowerCase() !== normalizedRecipient ||
      !Array.isArray(contact.addresses)
    ) {
      continue;
    }

    const exactCurrencyAddress = contact.addresses.find(
      address => address.currencyId === currencyId,
    );
    const networkAddresses = contact.addresses.filter(
      address => resolveRecipientNetworkId(address.currencyId) === recipientNetworkId,
    );
    const address =
      exactCurrencyAddress ?? (networkAddresses.length === 1 ? networkAddresses[0] : undefined);

    if (address) {
      return {
        contactId: contact.id,
        contactName: contact.name,
        addressId: address.id,
        addressLabel: address.label,
        address: address.address,
      };
    }
  }

  return undefined;
}
