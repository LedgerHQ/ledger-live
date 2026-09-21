import {
  contact,
  contactAddress,
  type Contact,
  type ContactAddressInput,
  type ContactInput,
} from "@domain/entity-contact";
import { mapBytesToGroupHandle, mapBytesToProof } from "../contactsKitMappers";
import { toTronAddressBook } from "./toTronAddressBook";

// Proof material reaches this mapper the way it was persisted: 0x-prefixed, as
// the Contacts kit mappers emit it through the kit's `bufferToHexaString`.
const GROUP_HANDLE_HEX = `0x${"ab".repeat(64)}`;
const HMAC_PROOF_HEX = `0x${"cd".repeat(32)}`;
const HMAC_REST_HEX = `0x${"ef".repeat(32)}`;

const ADDRESS = "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL";

function tronAddress(overrides: Partial<ContactAddressInput> = {}) {
  return contactAddress({
    id: "address-tron",
    currencyId: "tron",
    label: "Tron",
    address: ADDRESS,
    // Tron records still store a chain id in the domain (the coin type), but the
    // mapper never reads it: the Tron firmware book carries no chain id.
    device: { blockchainFamily: "tron", chainId: 195, hmacRest: HMAC_REST_HEX },
    ...overrides,
  });
}

function tronContact(overrides: Partial<ContactInput> = {}): Contact {
  return contact({
    id: "contact-ben",
    isMe: false,
    name: "Ben",
    deviceCredentials: { groupHandle: GROUP_HANDLE_HEX, hmacProof: HMAC_PROOF_HEX },
    addresses: [tronAddress()],
    ...overrides,
  });
}

describe("toTronAddressBook", () => {
  it("maps a contact and its address into a nested snapshot with no chain id", () => {
    const book = toTronAddressBook([tronContact()]);

    expect(book).toEqual({
      ledgerAccounts: [],
      contactGroups: [
        {
          contactName: "Ben",
          groupHandle: new Uint8Array(64).fill(0xab),
          hmacProof: new Uint8Array(32).fill(0xcd),
          externalAddresses: [
            {
              scope: "Tron",
              address: ADDRESS,
              hmacRest: new Uint8Array(32).fill(0xef),
            },
          ],
        },
      ],
    });
  });

  it("uses the address label as the device-side scope", () => {
    const book = toTronAddressBook([
      tronContact({ addresses: [tronAddress({ label: "My Binance TRX" })] }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses[0]?.scope).toBe("My Binance TRX");
  });

  it("keeps every address of a group", () => {
    const book = toTronAddressBook([
      tronContact({
        addresses: [
          tronAddress({ id: "address-tron-1" }),
          tronAddress({ id: "address-tron-2", address: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8" }),
        ],
      }),
    ]);

    expect(book?.contactGroups).toHaveLength(1);
    expect(book?.contactGroups[0]?.externalAddresses.map(a => a.address)).toEqual([
      ADDRESS,
      "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
    ]);
  });

  it("ignores the stored chain id: a Tron address survives any chain id value", () => {
    const book = toTronAddressBook([
      tronContact({
        addresses: [
          tronAddress({
            device: { blockchainFamily: "tron", chainId: "not-a-chain-id", hmacRest: HMAC_REST_HEX },
          }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses).toHaveLength(1);
  });

  it("maps the Me contact like any other group", () => {
    const book = toTronAddressBook([
      contact({
        id: "contact-me",
        isMe: true,
        name: "Me",
        deviceCredentials: { groupHandle: GROUP_HANDLE_HEX, hmacProof: HMAC_PROOF_HEX },
        addresses: [tronAddress()],
      }),
    ]);

    expect(book?.contactGroups[0]?.contactName).toBe("Me");
  });

  it("accepts proof material the kit mappers produced", () => {
    const groupHandle = new Uint8Array(64).fill(0xab);
    const hmacProof = new Uint8Array(32).fill(0xcd);
    const hmacRest = new Uint8Array(32).fill(0xef);

    const book = toTronAddressBook([
      tronContact({
        deviceCredentials: {
          groupHandle: mapBytesToGroupHandle(groupHandle),
          hmacProof: mapBytesToProof(hmacProof),
        },
        addresses: [
          tronAddress({
            device: { blockchainFamily: "tron", chainId: 195, hmacRest: mapBytesToProof(hmacRest) },
          }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.groupHandle).toEqual(groupHandle);
    expect(book?.contactGroups[0]?.hmacProof).toEqual(hmacProof);
    expect(book?.contactGroups[0]?.externalAddresses[0]?.hmacRest).toEqual(hmacRest);
  });

  it("accepts uppercase hex proof material", () => {
    const book = toTronAddressBook([
      tronContact({
        deviceCredentials: {
          groupHandle: GROUP_HANDLE_HEX.toUpperCase(),
          hmacProof: HMAC_PROOF_HEX.toUpperCase(),
        },
      }),
    ]);

    expect(book?.contactGroups[0]?.groupHandle).toEqual(new Uint8Array(64).fill(0xab));
  });

  it("drops addresses from another blockchain family", () => {
    const book = toTronAddressBook([
      tronContact({
        addresses: [
          tronAddress({
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
    expect(toTronAddressBook([tronContact({ addresses: [] })])).toBeUndefined();
  });

  it.each([
    ["a non-hex group handle", { groupHandle: "mock-contact-group-handle" }],
    ["a non-hex name proof", { hmacProof: "mock-external-contact-name-proof" }],
    ["an odd-length group handle", { groupHandle: "abc" }],
  ])("drops a group with %s", (_label, credentials) => {
    const book = toTronAddressBook([
      tronContact({
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
    const book = toTronAddressBook([
      tronContact({
        addresses: [
          tronAddress({
            device: {
              blockchainFamily: "tron",
              chainId: 195,
              hmacRest: "mock-external-address-proof",
            },
          }),
        ],
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it.each([
    ["does not start with T", "1NPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL"],
    ["is too short", "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqe"],
    ["contains a non-Base58 character", "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqe0"],
  ])("drops an address that %s", (_label, address) => {
    expect(
      toTronAddressBook([tronContact({ addresses: [tronAddress({ address })] })]),
    ).toBeUndefined();
  });

  it("keeps the valid addresses of a group and drops only the broken ones", () => {
    const book = toTronAddressBook([
      tronContact({
        addresses: [
          tronAddress({
            id: "address-broken",
            device: { blockchainFamily: "tron", chainId: 195, hmacRest: "not-hex" },
          }),
          tronAddress({ id: "address-tron" }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses).toHaveLength(1);
  });

  it("returns undefined for an empty contact list", () => {
    expect(toTronAddressBook([])).toBeUndefined();
  });

  it("never emits Ledger account contacts", () => {
    expect(toTronAddressBook([tronContact()])?.ledgerAccounts).toEqual([]);
  });
});
