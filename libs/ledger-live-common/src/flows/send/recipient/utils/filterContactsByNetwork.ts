import { resolveRecipientNetworkId } from "./resolveRecipientNetworkId";

type ContactWithAddresses = Readonly<{
  isMe: boolean;
  addresses: readonly Readonly<{ currencyId: string }>[];
}>;

export function filterContactsByNetwork<TContact extends ContactWithAddresses>(
  contacts: readonly TContact[],
  currencyId: string,
  { includeMe = false }: Readonly<{ includeMe?: boolean }> = {},
): TContact[] {
  const networkId = resolveRecipientNetworkId(currencyId);

  return contacts.reduce<TContact[]>((matchingContacts, contact) => {
    if (contact.isMe && !includeMe) {
      return matchingContacts;
    }

    const addresses = contact.addresses.filter(
      address => resolveRecipientNetworkId(address.currencyId) === networkId,
    );
    // Me stays listed without a matching address, so the user can add one from there.
    if (addresses.length > 0 || contact.isMe) {
      matchingContacts.push({ ...contact, addresses } as TContact);
    }

    return matchingContacts;
  }, []);
}
