import { resolveRecipientNetworkId } from "./resolveRecipientNetworkId";

type ContactAddress = Readonly<{
  currencyId: string;
}>;

type Contact<TAddress extends ContactAddress = ContactAddress> = Readonly<{
  isMe?: boolean;
  addresses: readonly TAddress[];
}>;

type NamedContact = Contact &
  Readonly<{
    name: string;
  }>;

export function getContactsOnNetwork<
  TAddress extends ContactAddress,
  TContact extends Contact<TAddress>,
>(contacts: readonly TContact[], currencyId: string): TContact[] {
  const networkId = resolveRecipientNetworkId(currencyId);

  return contacts.reduce<TContact[]>((matchingContacts, contact) => {
    if (contact.isMe) {
      return matchingContacts;
    }

    const addresses = contact.addresses.filter(
      address => resolveRecipientNetworkId(address.currencyId) === networkId,
    );
    if (addresses.length > 0) {
      matchingContacts.push({ ...contact, addresses });
    }

    return matchingContacts;
  }, []);
}

export function findContactWithMultipleAddressesByName<TContact extends NamedContact>(
  contacts: readonly TContact[],
  searchValue: string,
): TContact | undefined {
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  if (!normalizedSearchValue) {
    return undefined;
  }

  return contacts.find(
    contact =>
      contact.addresses.length > 1 && contact.name.trim().toLowerCase() === normalizedSearchValue,
  );
}

export function hasContactsOnNetwork(contacts: readonly Contact[], currencyId: string): boolean {
  return getContactsOnNetwork(contacts, currencyId).length > 0;
}
