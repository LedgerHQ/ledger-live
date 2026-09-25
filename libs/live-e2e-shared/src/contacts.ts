import { randomUUID } from "node:crypto";
import { DeviceModelId } from "@ledgerhq/devices";
import { Addresses } from "./enum/Addresses";

// A space is the only separator ContactNamePattern accepts between name segments.
const CONTACT_NAME_FORMAT_SAMPLE = "O Neil Zoe";

/**
 * Distant `me.name` for an empty Me contact.
 *
 * @see [DEFAULT_ME_CONTACT_NAME](../../../domain/entity/contact/src/constants.ts)
 */
const SEEDED_ME_CONTACT_NAME = "Me";

/**
 * Valid contact name, unique per call — duplicates are rejected on save.
 *
 * @see [ContactNamePattern](../../../domain/entity/contact/src/schema.ts) for the accepted format.
 */
export function generateContactName(): string {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6);

  return `${CONTACT_NAME_FORMAT_SAMPLE} ${suffix}`.normalize("NFC");
}

export type ContactAddressSeed = Readonly<{
  /** Doubles as the `send-recipient-contact-address-<id>` test id. */
  id: string;
  currencyId: string;
  label: string;
  address: string;
}>;

export type ContactSeed = Readonly<{
  /** Doubles as the `contacts-compact-row-<id>` test id. */
  id: string;
  name: string;
  addresses: readonly ContactAddressSeed[];
}>;

/**
 * Not hex on purpose: `toEvmAddressBook` drops what it cannot decode, keeping seeded
 * contacts out of the device address book so signing screens stay unchanged.
 */
const NOT_A_PROOF = "e2e-seeded-contact";

/** Contacts shaped for the `contacts/setContacts` reducer. */
export function buildSeededContacts(seeds: readonly ContactSeed[]) {
  return seeds.map(seed => ({
    ...seed,
    isMe: false,
    deviceCredentials: { groupHandle: NOT_A_PROOF, hmacProof: NOT_A_PROOF },
    addresses: seed.addresses.map(address => ({
      ...address,
      device: { blockchainFamily: "e2e", chainId: "0", hmacRest: NOT_A_PROOF },
    })),
  }));
}

/** Ten distinct names in storage order, not UI order — the list must sort them alphabetically. */
export const SEEDED_CONTACT_NAMES = [
  "Hugo",
  "Alice",
  "Jules",
  "Clara",
  "Iris",
  "Elena",
  "Benoit",
  "Farah",
  "Diana",
  "Grace",
] as const;

export type LedgerSyncContactGroupDescriptor = {
  id: string;
  name: string;
};

export function createSeededContactGroups(): LedgerSyncContactGroupDescriptor[] {
  return SEEDED_CONTACT_NAMES.map(name => ({
    id: `e2e-contact-${name.toLowerCase()}`,
    name,
  }));
}

export function createSeededContactsDocument(
  contactGroups: readonly LedgerSyncContactGroupDescriptor[],
) {
  return {
    accounts: [],
    accountNames: {},
    contacts: {
      me: { name: SEEDED_ME_CONTACT_NAME, addresses: [] },
      contactGroups: contactGroups.map(({ id, name }) => ({
        id,
        name,
        addresses: [],
      })),
    },
  };
}

// Contacts intents need Ethereum 1.23.0. The catalog is still on 1.22.x, so runs pin
// coin-apps' 1.23.0-dev and the rc OS it ships on. Stax rc stops at 1.19.3. Nano S is unsupported.
export const CONTACTS_ETHEREUM_APP_VERSION = "1.23.0-dev";

export const CONTACTS_OS_VERSION_BY_MODEL: Partial<Record<DeviceModelId, string>> = {
  [DeviceModelId.nanoSP]: "1.7.0-rc2",
  [DeviceModelId.nanoX]: "2.8.0-rc2",
  [DeviceModelId.europa]: "1.7.0-rc2",
  [DeviceModelId.apex]: "1.2.0-rc2",
};

export type ContactAddressTestData = Readonly<{
  ticker: string;
  networkId: string;
  networkName: string;
  addressInput: string;
  savedValue: string;
  defaultAddressLabel: string;
  /** Replaces the prefill when that label is already used on the contact. */
  addressLabel: string;
  isEns?: boolean;
}>;

export const CONTACT_ADDRESS_DATASET: readonly ContactAddressTestData[] = [
  {
    ticker: "ETH",
    networkId: "ethereum",
    networkName: "Ethereum",
    addressInput: Addresses.ETH_OTHER_SEED,
    savedValue: Addresses.ETH_OTHER_SEED,
    defaultAddressLabel: "Ethereum",
    addressLabel: "Ethereum",
  },
  {
    ticker: "ETH",
    networkId: "ethereum",
    networkName: "Ethereum",
    addressInput: "speculos-qaa.eth",
    savedValue: Addresses.ETH_2,
    defaultAddressLabel: "Ethereum",
    addressLabel: "ENS",
    isEns: true,
  },
  {
    ticker: "BNB",
    networkId: "bsc",
    networkName: "BNB Chain",
    addressInput: Addresses.SWAP_HISTORY_ETH_TO,
    savedValue: Addresses.SWAP_HISTORY_ETH_TO,
    defaultAddressLabel: "BNB Chain",
    addressLabel: "BNB Chain",
  },
  {
    ticker: "POL",
    networkId: "polygon",
    networkName: "Polygon",
    addressInput: Addresses.SWAP_HISTORY_ERC20_ETH_USDT_TO,
    savedValue: Addresses.SWAP_HISTORY_ERC20_ETH_USDT_TO,
    defaultAddressLabel: "Polygon",
    addressLabel: "Polygon",
  },
];
