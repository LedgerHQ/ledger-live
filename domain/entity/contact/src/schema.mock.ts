import { contact, contactAddress } from "./define";
import type { Contact, ContactAddress, ContactAddressInput, ContactInput } from "./types";

export function mockContactAddress(overrides?: Partial<ContactAddressInput>): ContactAddress {
  return contactAddress({
    id: "address-ethereum",
    currencyId: "ethereum",
    label: "Ethereum",
    address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    ...overrides,
  });
}

export function mockMeContact(overrides?: Partial<ContactInput>): Contact {
  return contact({
    id: "contact-me",
    isMe: true,
    name: "Me",
    addresses: [],
    ...overrides,
  });
}

export function mockContact(overrides?: Partial<ContactInput>): Contact {
  return contact({
    id: "contact-ben",
    isMe: false,
    name: "Ben",
    addresses: [],
    ...overrides,
  });
}

export function mockContactWithAddress(overrides?: Partial<ContactInput>): Contact {
  return mockContact({
    addresses: [mockContactAddress()],
    ...overrides,
  });
}

export function mockContactWithMultipleAddresses(overrides?: Partial<ContactInput>): Contact {
  return mockContact({
    addresses: [
      mockContactAddress({
        id: "address-polygon",
        currencyId: "polygon",
        label: "Polygon",
        address: "0x2ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      }),
      mockContactAddress(),
    ],
    ...overrides,
  });
}

export function mockEmptyContacts(): Contact[] {
  return [mockMeContact()];
}

export function mockPopulatedContacts(): Contact[] {
  return [
    mockMeContact(),
    mockContact({ id: "contact-ada", name: "Ada" }),
    mockContactWithMultipleAddresses(),
    mockContact({ id: "contact-olive", name: "Olive" }),
  ];
}
