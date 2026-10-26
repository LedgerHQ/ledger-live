import {
  contact,
  contactAddress,
  type Contact,
  type ContactAddressInput,
  type ContactInput,
} from "@domain/entity-contact";
import { mapBytesToGroupHandle, mapBytesToProof } from "../contactsKitMappers";
import { toSolanaAddressBook } from "./toSolanaAddressBook";

// Proof material reaches this mapper the way it was persisted: 0x-prefixed, as
// the Contacts kit mappers emit it through the kit's `bufferToHexaString`.
const GROUP_HANDLE_HEX = `0x${"ab".repeat(64)}`;
const HMAC_PROOF_HEX = `0x${"cd".repeat(32)}`;
const HMAC_REST_HEX = `0x${"ef".repeat(32)}`;

const ADDRESS = "HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfhW";

function solanaAddress(overrides: Partial<ContactAddressInput> = {}) {
  return contactAddress({
    id: "address-solana",
    currencyId: "solana",
    label: "Solana",
    address: ADDRESS,
    // Solana records still store a chain id in the domain (the coin type), but the
    // mapper never reads it: the Solana firmware book carries no chain id.
    device: { blockchainFamily: "solana", chainId: 501, hmacRest: HMAC_REST_HEX },
    ...overrides,
  });
}

function solanaContact(overrides: Partial<ContactInput> = {}): Contact {
  return contact({
    id: "contact-ben",
    isMe: false,
    name: "Ben",
    deviceCredentials: { groupHandle: GROUP_HANDLE_HEX, hmacProof: HMAC_PROOF_HEX },
    addresses: [solanaAddress()],
    ...overrides,
  });
}

describe("toSolanaAddressBook", () => {
  it("maps a contact and its address into a nested snapshot with no chain id", () => {
    const book = toSolanaAddressBook([solanaContact()]);

    expect(book).toEqual({
      ledgerAccounts: [],
      contactGroups: [
        {
          contactName: "Ben",
          groupHandle: new Uint8Array(64).fill(0xab),
          hmacProof: new Uint8Array(32).fill(0xcd),
          externalAddresses: [
            {
              scope: "Solana",
              address: ADDRESS,
              hmacRest: new Uint8Array(32).fill(0xef),
            },
          ],
        },
      ],
    });
  });

  it("uses the address label as the device-side scope", () => {
    const book = toSolanaAddressBook([
      solanaContact({ addresses: [solanaAddress({ label: "My Phantom wallet" })] }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses[0]?.scope).toBe("My Phantom wallet");
  });

  it("keeps every address of a group", () => {
    const book = toSolanaAddressBook([
      solanaContact({
        addresses: [
          solanaAddress({ id: "address-solana-1" }),
          solanaAddress({
            id: "address-solana-2",
            address: "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
          }),
        ],
      }),
    ]);

    expect(book?.contactGroups).toHaveLength(1);
    expect(book?.contactGroups[0]?.externalAddresses.map(a => a.address)).toEqual([
      ADDRESS,
      "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
    ]);
  });

  it("ignores the stored chain id: a Solana address survives any chain id value", () => {
    const book = toSolanaAddressBook([
      solanaContact({
        addresses: [
          solanaAddress({
            device: {
              blockchainFamily: "solana",
              chainId: "not-a-chain-id",
              hmacRest: HMAC_REST_HEX,
            },
          }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses).toHaveLength(1);
  });

  it("maps the Me contact like any other group", () => {
    const book = toSolanaAddressBook([
      contact({
        id: "contact-me",
        isMe: true,
        name: "Me",
        deviceCredentials: { groupHandle: GROUP_HANDLE_HEX, hmacProof: HMAC_PROOF_HEX },
        addresses: [solanaAddress()],
      }),
    ]);

    expect(book?.contactGroups[0]?.contactName).toBe("Me");
  });

  it("accepts proof material the kit mappers produced", () => {
    const groupHandle = new Uint8Array(64).fill(0xab);
    const hmacProof = new Uint8Array(32).fill(0xcd);
    const hmacRest = new Uint8Array(32).fill(0xef);

    const book = toSolanaAddressBook([
      solanaContact({
        deviceCredentials: {
          groupHandle: mapBytesToGroupHandle(groupHandle),
          hmacProof: mapBytesToProof(hmacProof),
        },
        addresses: [
          solanaAddress({
            device: {
              blockchainFamily: "solana",
              chainId: 501,
              hmacRest: mapBytesToProof(hmacRest),
            },
          }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.groupHandle).toEqual(groupHandle);
    expect(book?.contactGroups[0]?.hmacProof).toEqual(hmacProof);
    expect(book?.contactGroups[0]?.externalAddresses[0]?.hmacRest).toEqual(hmacRest);
  });

  it("accepts uppercase hex proof material", () => {
    const book = toSolanaAddressBook([
      solanaContact({
        deviceCredentials: {
          groupHandle: GROUP_HANDLE_HEX.toUpperCase(),
          hmacProof: HMAC_PROOF_HEX.toUpperCase(),
        },
      }),
    ]);

    expect(book?.contactGroups[0]?.groupHandle).toEqual(new Uint8Array(64).fill(0xab));
  });

  it("drops addresses from another blockchain family", () => {
    const book = toSolanaAddressBook([
      solanaContact({
        addresses: [
          solanaAddress({
            currencyId: "ethereum",
            label: "Ethereum",
            address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
            device: { blockchainFamily: "evm", chainId: 1, hmacRest: HMAC_REST_HEX },
          }),
        ],
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it("drops a contact that has no address", () => {
    expect(toSolanaAddressBook([solanaContact({ addresses: [] })])).toBeUndefined();
  });

  it.each([
    ["a non-hex group handle", { groupHandle: "mock-contact-group-handle" }],
    ["a non-hex name proof", { hmacProof: "mock-external-contact-name-proof" }],
    ["an odd-length group handle", { groupHandle: "abc" }],
  ])("drops a group with %s", (_label, credentials) => {
    const book = toSolanaAddressBook([
      solanaContact({
        deviceCredentials: {
          groupHandle: GROUP_HANDLE_HEX,
          hmacProof: HMAC_PROOF_HEX,
          ...credentials,
        },
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it("drops an address with a non-hex address proof", () => {
    const book = toSolanaAddressBook([
      solanaContact({
        addresses: [
          solanaAddress({
            device: {
              blockchainFamily: "solana",
              chainId: 501,
              hmacRest: "mock-external-address-proof",
            },
          }),
        ],
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it.each([
    ["is a hex address", "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034"],
    ["is too short", "HxFLKUAmAMLz1jtT3hbvCMELwH5H9tp"],
    ["is too long", "HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfhWX"],
    ["contains a non-Base58 character", "HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfh0"],
  ])("drops an address that %s", (_label, address) => {
    expect(
      toSolanaAddressBook([solanaContact({ addresses: [solanaAddress({ address })] })]),
    ).toBeUndefined();
  });

  it("drops a Tron address stored under another family", () => {
    const book = toSolanaAddressBook([
      solanaContact({
        addresses: [
          solanaAddress({
            currencyId: "tron",
            label: "Tron",
            address: "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL",
            device: { blockchainFamily: "tron", chainId: 195, hmacRest: HMAC_REST_HEX },
          }),
        ],
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it("keeps the valid addresses of a group and drops only the broken ones", () => {
    const book = toSolanaAddressBook([
      solanaContact({
        addresses: [
          solanaAddress({
            id: "address-broken",
            device: { blockchainFamily: "solana", chainId: 501, hmacRest: "not-hex" },
          }),
          solanaAddress({ id: "address-solana" }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses).toHaveLength(1);
  });

  it("returns undefined for an empty contact list", () => {
    expect(toSolanaAddressBook([])).toBeUndefined();
  });

  it("never emits Ledger account contacts", () => {
    expect(toSolanaAddressBook([solanaContact()])?.ledgerAccounts).toEqual([]);
  });
});
