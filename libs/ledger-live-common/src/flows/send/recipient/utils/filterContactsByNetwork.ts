import { resolveRecipientNetworkId } from "./resolveRecipientNetworkId";

type ContactWithAddresses = Readonly<{
  isMe: boolean;
  addresses: readonly Readonly<{ currencyId: string }>[];
}>;

export function filterContactsByNetwork<TContact extends ContactWithAddresses>(
  contacts: readonly TContact[],
  currencyId: string,
): TContact[] {
  const networkId = resolveRecipientNetworkId(currencyId);

  return contacts.reduce<TContact[]>((matchingContacts, contact) => {
    if (contact.isMe) {
      return matchingContacts;
    }

    const addresses = contact.addresses.filter(
      address => resolveRecipientNetworkId(address.currencyId) === networkId,
    );
    if (addresses.length > 0) {
      matchingContacts.push({ ...contact, addresses } as TContact);
    }

    return matchingContacts;
  }, []);
}
