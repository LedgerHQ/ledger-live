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

    const address = resolveUnambiguousContactAddress(
      contact.addresses,
      currencyId,
      recipientNetworkId,
    );

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

function uniqueAddressesByValue(addresses: readonly ContactAddress[]): ContactAddress[] {
  return addresses.filter(
    (address, index) =>
      addresses.findIndex(candidate => addressesMatch(candidate.address, address.address)) ===
      index,
  );
}

function resolveUnambiguousContactAddress(
  addresses: readonly ContactAddress[],
  currencyId: string,
  recipientNetworkId: string,
): ContactAddress | undefined {
  const uniqueExactCurrencyAddresses = uniqueAddressesByValue(
    addresses.filter(address => address.currencyId === currencyId),
  );
  if (uniqueExactCurrencyAddresses.length === 1) {
    return uniqueExactCurrencyAddresses[0];
  }

  const uniqueNetworkAddresses = uniqueAddressesByValue(
    addresses.filter(
      address => resolveRecipientNetworkId(address.currencyId) === recipientNetworkId,
    ),
  );

  return uniqueNetworkAddresses.length === 1 ? uniqueNetworkAddresses[0] : undefined;
}
