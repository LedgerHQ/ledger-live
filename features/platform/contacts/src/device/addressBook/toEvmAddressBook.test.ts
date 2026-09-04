import {
  contact,
  contactAddress,
  type Contact,
  type ContactAddressInput,
  type ContactInput,
} from "@domain/entity-contact";
import { toEvmAddressBook } from "./toEvmAddressBook";

const GROUP_HANDLE_HEX = "ab".repeat(64);
const HMAC_PROOF_HEX = "cd".repeat(32);
const HMAC_REST_HEX = "ef".repeat(32);

const ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";

function evmAddress(overrides: Partial<ContactAddressInput> = {}) {
  return contactAddress({
    id: "address-ethereum",
    currencyId: "ethereum",
    label: "Ethereum",
    address: ADDRESS,
    device: { blockchainFamily: "evm", chainId: 1, hmacRest: HMAC_REST_HEX },
    ...overrides,
  });
}

function evmContact(overrides: Partial<ContactInput> = {}): Contact {
  return contact({
    id: "contact-ben",
    isMe: false,
    name: "Ben",
    deviceCredentials: { groupHandle: GROUP_HANDLE_HEX, hmacProof: HMAC_PROOF_HEX },
    addresses: [evmAddress()],
    ...overrides,
  });
}

describe("toEvmAddressBook", () => {
  it("maps a contact and its address into a nested snapshot", () => {
    const book = toEvmAddressBook([evmContact()]);

    expect(book).toEqual({
      ledgerAccounts: [],
      contactGroups: [
        {
          contactName: "Ben",
          groupHandle: new Uint8Array(64).fill(0xab),
          hmacProof: new Uint8Array(32).fill(0xcd),
          externalAddresses: [
            {
              scope: "Ethereum",
              address: ADDRESS,
              chainId: 1n,
              hmacRest: new Uint8Array(32).fill(0xef),
            },
          ],
        },
      ],
    });
  });

  it("uses the address label as the device-side scope", () => {
    const book = toEvmAddressBook([
      evmContact({ addresses: [evmAddress({ label: "My Coinbase USDT" })] }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses[0]?.scope).toBe("My Coinbase USDT");
  });

  it("keeps token addresses, reading the chain from the stored device context", () => {
    const book = toEvmAddressBook([
      evmContact({
        addresses: [
          evmAddress({
            id: "address-arbitrum-usdc",
            currencyId: "arbitrum/erc20/usd_coin",
            label: "USDC",
            device: { blockchainFamily: "evm", chainId: 42161, hmacRest: HMAC_REST_HEX },
          }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses[0]?.chainId).toBe(42161n);
  });

  it("keeps every address of a group across different chains", () => {
    const book = toEvmAddressBook([
      evmContact({
        addresses: [
          evmAddress({ id: "address-ethereum" }),
          evmAddress({
            id: "address-base",
            currencyId: "base",
            label: "Base",
            device: { blockchainFamily: "evm", chainId: 8453, hmacRest: HMAC_REST_HEX },
          }),
        ],
      }),
    ]);

    expect(book?.contactGroups).toHaveLength(1);
    expect(book?.contactGroups[0]?.externalAddresses.map(address => address.chainId)).toEqual([
      1n,
      8453n,
    ]);
  });

  it("maps the Me contact like any other group", () => {
    const book = toEvmAddressBook([
      contact({
        id: "contact-me",
        isMe: true,
        name: "Me",
        deviceCredentials: { groupHandle: GROUP_HANDLE_HEX, hmacProof: HMAC_PROOF_HEX },
        addresses: [evmAddress()],
      }),
    ]);

    expect(book?.contactGroups[0]?.contactName).toBe("Me");
  });

  it("accepts uppercase hex proof material", () => {
    const book = toEvmAddressBook([
      evmContact({
        deviceCredentials: {
          groupHandle: GROUP_HANDLE_HEX.toUpperCase(),
          hmacProof: HMAC_PROOF_HEX.toUpperCase(),
        },
      }),
    ]);

    expect(book?.contactGroups[0]?.groupHandle).toEqual(new Uint8Array(64).fill(0xab));
  });

  it("drops addresses from another blockchain family", () => {
    const book = toEvmAddressBook([
      evmContact({
        addresses: [
          evmAddress({
            currencyId: "tron",
            label: "Tron",
            device: { blockchainFamily: "tron", chainId: 195, hmacRest: HMAC_REST_HEX },
          }),
        ],
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it("drops a contact that has no address", () => {
    expect(toEvmAddressBook([evmContact({ addresses: [] })])).toBeUndefined();
  });

  it.each([
    ["a non-hex group handle", { groupHandle: "mock-contact-group-handle" }],
    ["a non-hex name proof", { hmacProof: "mock-external-contact-name-proof" }],
    ["an odd-length group handle", { groupHandle: "abc" }],
  ])("drops a group with %s", (_label, credentials) => {
    const book = toEvmAddressBook([
      evmContact({
        deviceCredentials: {
          groupHandle: GROUP_HANDLE_HEX,
          hmacProof: HMAC_PROOF_HEX,
          ...credentials,
        },
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it.each([
    ["a non-hex address proof", { hmacRest: "mock-external-address-proof" }],
    ["an unparsable chain id", { chainId: "mock-chain-id" }],
    ["a zero chain id", { chainId: 0 }],
  ])("drops an address with %s", (_label, device) => {
    const book = toEvmAddressBook([
      evmContact({
        addresses: [
          evmAddress({
            device: { blockchainFamily: "evm", chainId: 1, hmacRest: HMAC_REST_HEX, ...device },
          }),
        ],
      }),
    ]);

    expect(book).toBeUndefined();
  });

  it.each([
    ["is not 0x-prefixed", "1ad23b2cf8d2e0591ea417eb82f7cd9746c53034"],
    ["is too short", "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c530"],
    ["is not hexadecimal", "0xZad23b2cf8d2e0591ea417eb82f7cd9746c53034"],
  ])("drops an address that %s", (_label, address) => {
    expect(
      toEvmAddressBook([evmContact({ addresses: [evmAddress({ address })] })]),
    ).toBeUndefined();
  });

  it("keeps the valid addresses of a group and drops only the broken ones", () => {
    const book = toEvmAddressBook([
      evmContact({
        addresses: [
          evmAddress({
            id: "address-broken",
            device: { blockchainFamily: "evm", chainId: 1, hmacRest: "not-hex" },
          }),
          evmAddress({ id: "address-ethereum" }),
        ],
      }),
    ]);

    expect(book?.contactGroups[0]?.externalAddresses).toHaveLength(1);
  });

  it("returns undefined for an empty contact list", () => {
    expect(toEvmAddressBook([])).toBeUndefined();
  });

  it("never emits Ledger account contacts", () => {
    expect(toEvmAddressBook([evmContact()])?.ledgerAccounts).toEqual([]);
  });
});
