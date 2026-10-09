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
        address: "0x1234abcd12345678901234567890123456789012",
      }),
      mockContactAddress({
        id: "address-me-base-usdt",
        currencyId: "base/erc20/tether_usd",
        label: "USDT",
        address: "0x9f8e7d6c5b4a3928171615141312111009080706",
      }),
      mockContactAddress({
        id: "address-me-ethereum",
        currencyId: "ethereum",
        label: "Ethereum",
        address: "0xdd3f8f1234567890123456789012345678901234",
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

type MockSendHistoryOperation = Readonly<{
  type: string;
  date: Date;
  recipients: readonly string[];
}>;

type MockSendHistoryCurrency = Readonly<{ id: string; ticker: string }>;

export type MockSendHistoryAccount = Readonly<{
  operations: readonly MockSendHistoryOperation[];
  pendingOperations: readonly MockSendHistoryOperation[];
}> &
  (
    | Readonly<{ type: "Account"; currency: MockSendHistoryCurrency }>
    | Readonly<{ type: "TokenAccount"; token: MockSendHistoryCurrency }>
  );

type SendHistoryEntry = { address: string; currencyId: string; label: string; date: number };

const MAX_SEND_HISTORY_CONTACTS = 15;

/** Cycled so the generated list mixes single-address contacts with multi-address ones. */
const SEND_HISTORY_ADDRESS_COUNTS = [1, 2, 1, 3] as const;

/**
 * Builds contacts from the distinct addresses the accounts have sent to, most recent first, so the
 * Pay contacts can be exercised against real `last sent-to` ordering instead of synthetic addresses
 * that no operation targets.
 */
export function mockContactsFromSendHistory(
  accounts: readonly MockSendHistoryAccount[],
): Contact[] {
  const latestByAddress = new Map<string, SendHistoryEntry>();

  for (const account of accounts) {
    const currency = account.type === "TokenAccount" ? account.token : account.currency;

    for (const operation of [...account.pendingOperations, ...account.operations]) {
      if (operation.type !== "OUT") continue;

      const date = operation.date.getTime();

      for (const recipient of operation.recipients) {
        const key = `${currency.id}:${recipient.toLowerCase()}`;
        const existing = latestByAddress.get(key);

        if (!existing || date > existing.date) {
          latestByAddress.set(key, {
            address: recipient,
            currencyId: currency.id,
            label: currency.ticker,
            date,
          });
        }
      }
    }
  }

  const entries = [...latestByAddress.values()].sort((left, right) => right.date - left.date);
  const contacts: Contact[] = [];
  let cursor = 0;

  while (cursor < entries.length && contacts.length < MAX_SEND_HISTORY_CONTACTS) {
    const index = contacts.length;
    const id = `contact-send-history-${index + 1}`;
    const addressCount = SEND_HISTORY_ADDRESS_COUNTS[index % SEND_HISTORY_ADDRESS_COUNTS.length];
    const group = entries.slice(cursor, cursor + addressCount);

    cursor += group.length;

    contacts.push(
      contact({
        id,
        isMe: false,
        name: `Payee ${index + 1}`,
        addresses: group.map((entry, addressIndex) =>
          contactAddress({
            id: `${id}-address-${addressIndex + 1}`,
            currencyId: entry.currencyId,
            label: group.length > 1 ? `${entry.label} ${addressIndex + 1}` : entry.label,
            address: entry.address,
            device: mockExternalAddressDeviceContext(),
          }),
        ),
        deviceCredentials: mockDeviceContactGroupCredentials(),
      }),
    );
  }

  return contacts;
}
