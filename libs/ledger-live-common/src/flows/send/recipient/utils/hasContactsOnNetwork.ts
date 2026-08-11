import { resolveRecipientNetworkId } from "./resolveRecipientNetworkId";

type ContactAddress = Readonly<{
  currencyId: string;
}>;

type Contact = Readonly<{
  addresses: readonly ContactAddress[];
}>;

export function hasContactsOnNetwork(contacts: readonly Contact[], currencyId: string): boolean {
  const networkId = resolveRecipientNetworkId(currencyId);

  return contacts.some(contact =>
    contact.addresses.some(address => resolveRecipientNetworkId(address.currencyId) === networkId),
  );
}
