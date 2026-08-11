import { DEFAULT_ME_CONTACT_ID, DEFAULT_ME_CONTACT_NAME } from "./constants";
import { contact, contactAddress } from "./define";
import {
  DeviceContactGroupCredentialsSchema,
  ExternalAddressDeviceContextSchema,
} from "./device/types";
import type { Contact, ContactAddress, ContactAddressInput, ContactInput } from "./types";
import type { DeviceContactGroupCredentials, ExternalAddressDeviceContext } from "./device/types";

export function mockDeviceContactGroupCredentials(
  overrides?: Partial<DeviceContactGroupCredentials>,
): DeviceContactGroupCredentials {
  return DeviceContactGroupCredentialsSchema.parse({
    groupHandle: "mock-contact-group-handle",
    hmacProof: "mock-external-contact-name-proof",
    ...overrides,
  });
}

export function mockExternalAddressDeviceContext(
  overrides?: Partial<ExternalAddressDeviceContext>,
): ExternalAddressDeviceContext {
  return ExternalAddressDeviceContextSchema.parse({
    blockchainFamily: "mock-blockchain-family",
    chainId: "mock-chain-id",
    hmacRest: "mock-external-address-proof",
    ...overrides,
  });
}

export function mockContactAddress(overrides?: Partial<ContactAddressInput>): ContactAddress {
  return contactAddress({
    id: "address-ethereum",
    currencyId: "ethereum",
    label: "Ethereum",
    address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    device: mockExternalAddressDeviceContext(),
    ...overrides,
  });
}

export function mockMeContact(overrides?: Partial<ContactInput>): Contact {
  const input = {
    id: DEFAULT_ME_CONTACT_ID,
    isMe: true,
    name: DEFAULT_ME_CONTACT_NAME,
    addresses: [],
    ...overrides,
  };
  const deviceCredentials = "deviceCredentials" in input ? input.deviceCredentials : undefined;

  return contact({
    ...input,
    ...(input.addresses.length > 0 && deviceCredentials === undefined
      ? { deviceCredentials: mockDeviceContactGroupCredentials() }
      : {}),
  });
}

export function mockMeContactWithAddresses(overrides?: Partial<ContactInput>): Contact {
  return mockMeContact({
    addresses: [
      mockContactAddress({
        id: "address-me-arbitrum-usdc",
        currencyId: "arbitrum/erc20/usd_coin",
        label: "USDC",
        address: "0x1234ABCD1234567890123456789012345678901234",
      }),
      mockContactAddress({
        id: "address-me-base-usdt",
        currencyId: "base/erc20/tether_usd",
        label: "USDT",
        address: "0x9F8E7D6C5B4A392817161514131211100908070605",
      }),
      mockContactAddress({
        id: "address-me-ethereum",
        currencyId: "ethereum",
        label: "Ethereum",
        address: "0xdD3F8f1234567890123456789012345678901234",
      }),
    ],
    deviceCredentials: mockDeviceContactGroupCredentials(),
    ...overrides,
  });
}

export function mockContact(overrides?: Partial<ContactInput>): Contact {
  const input = {
    id: "contact-ben",
    isMe: false,
    name: "Ben",
    addresses: [],
    ...overrides,
  };
  const deviceCredentials = "deviceCredentials" in input ? input.deviceCredentials : undefined;

  return contact({
    ...input,
    ...(input.addresses.length > 0 && deviceCredentials === undefined
      ? { deviceCredentials: mockDeviceContactGroupCredentials() }
      : {}),
  });
}

export function mockContactWithAddress(overrides?: Partial<ContactInput>): Contact {
  return mockContact({
    addresses: [mockContactAddress()],
    deviceCredentials: mockDeviceContactGroupCredentials(),
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
    deviceCredentials: mockDeviceContactGroupCredentials(),
    ...overrides,
  });
}

export function mockEmptyContacts(): Contact[] {
  return [mockMeContact()];
}

export function mockPopulatedContacts(): Contact[] {
  return [
    mockMeContactWithAddresses(),
    mockContact({ id: "contact-ada", name: "Ada" }),
    mockContactWithMultipleAddresses({ id: "contact-ben", name: "Ben" }),
    mockContactWithAddress({ id: "contact-charlie", name: "Charlie" }),
    mockContact({ id: "contact-diana", name: "Diana" }),
    mockContact({ id: "contact-olive", name: "Olive" }),
  ];
}
