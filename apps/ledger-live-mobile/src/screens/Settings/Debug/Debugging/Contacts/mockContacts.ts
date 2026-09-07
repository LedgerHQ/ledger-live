import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { contact, contactAddress, type Contact } from "@domain/entity-contact";
import {
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
} from "@domain/entity-contact/schema.mock";

const SAMPLE_CONTACT_NAMES = [
  "Ada",
  "Ben",
  "Clara",
  "David",
  "Elena",
  "Felix",
  "Gabriel",
  "Hana",
  "Iris",
  "Jonas",
  "Kiara",
  "Liam",
  "Maya",
  "Nora",
  "Olive",
  "Pablo",
  "Quinn",
  "Rosa",
  "Sofia",
  "Theo",
  "Uma",
  "Victor",
  "Xanna",
  "Yara",
  "\u042f\u043d\u0430",
] as const;

function createSampleAddresses(contactId: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    contactAddress({
      id: `${contactId}-address-${index + 1}`,
      currencyId: "ethereum",
      label: "Ethereum",
      address: `0x${String(index + 1).padStart(40, "0")}`,
      device: mockExternalAddressDeviceContext(),
    }),
  );
}

export function createContactsDebugSamples(): Contact[] {
  return SAMPLE_CONTACT_NAMES.map((name, index) => {
    const id = `contact-sample-${index + 1}`;

    const addresses = createSampleAddresses(id, index % 4);

    return contact({
      id,
      isMe: false,
      name,
      addresses,
      ...(addresses.length > 0 ? { deviceCredentials: mockDeviceContactGroupCredentials() } : {}),
    });
  });
}

const MAX_SEND_HISTORY_CONTACTS = 15;

type SendHistoryEntry = { address: string; currencyId: string; label: string; date: number };

/**
 * Builds one contact per distinct address the accounts have sent to, most recent first, so the Pay
 * strip can be exercised against real `last sent-to` ordering instead of synthetic addresses that no
 * operation targets.
 */
export function createContactsFromSendHistory(accounts: readonly AccountLike[]): Contact[] {
  const latestByAddress = new Map<string, SendHistoryEntry>();

  for (const account of accounts) {
    const currency = getAccountCurrency(account);
    const operations = [...account.pendingOperations, ...account.operations];

    for (const operation of operations) {
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

  return [...latestByAddress.values()]
    .sort((left, right) => right.date - left.date)
    .slice(0, MAX_SEND_HISTORY_CONTACTS)
    .map((entry, index) => {
      const id = `contact-send-history-${index + 1}`;

      return contact({
        id,
        isMe: false,
        name: `Payee ${index + 1}`,
        addresses: [
          contactAddress({
            id: `${id}-address-1`,
            currencyId: entry.currencyId,
            label: entry.label,
            address: entry.address,
            device: mockExternalAddressDeviceContext(),
          }),
        ],
        deviceCredentials: mockDeviceContactGroupCredentials(),
      });
    });
}
