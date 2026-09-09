import { randomUUID } from "node:crypto";

// Every separator a user can type. The straight `'` is excluded: iOS rewrites it to `’` on input.
const CONTACT_NAME_FORMAT_SAMPLE = "O’Neil-Zoe";

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
