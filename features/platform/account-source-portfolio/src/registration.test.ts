import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import {
  ADA,
  BIP84_XPUB,
  BITCOIN,
  DOT,
  ETH,
  POLYGON,
  TRX,
  evm,
  listed,
  synced,
} from "./internals/fakeService.mock";
import {
  missingRegistrations,
  portfolioAccountOf,
  registrationKey,
  unneededRegistrations,
} from "./registration";

/** The id staging gave the BIP84 account of the BIP39 test mnemonic. */
const BIP84_SERVICE_ID = "6b3ac4bc7086bb6ca2696a5b682806ee4e74eac5574562969f340a91d77e76bb";

/** The Cardano example of the service's OpenAPI spec, as our hex xpub, and the id staging gave it. */
const CARDANO_HEX =
  "8e8131277ac46bf6b526fff4fe00cecc71026c278340c44458878bd162f70367505e1ea016e67052b3697ac749e4b034010056e7fd8e8486682665cd9693fb21";
const CARDANO_XVK =
  "acct_xvk136qnzfm6c34lddfxll60uqxwe3csymp8sdqvg3zcs79azchhqdn4qhs75qtwvuzjkd5h436fujcrgqgq2mnlmr5yse5zvewdj6flkgg5catgs";
const CARDANO_SERVICE_ID = "2f3292c3fb36b41dea5ac2fb076c65f28a475966d3e39f3ff9cfcc63c03999d1";

describe("portfolioAccountOf", () => {
  it("registers an EVM address once for the fan-out, read as <network>:<lowercase address>", () => {
    const polygon = mockAddressAccountDescriptor({
      network: "polygon",
      address: "0xABcdef0000000000000000000000000000000001",
    });
    expect(portfolioAccountOf(polygon)).toEqual({
      registration: { type: "evm", address: polygon.address },
      serverAccountId: "polygon:0xabcdef0000000000000000000000000000000001",
    });
  });

  it("registers a Bitcoin xpub to derive from its first address, read by the SHA-256 of the xpub", () => {
    const descriptor = mockUtxoAccountDescriptor({ xpub: BIP84_XPUB, path: "m/84h/0h/0h" });
    expect(portfolioAccountOf(descriptor)).toEqual({
      registration: {
        type: "auto_derive",
        network: "bitcoin",
        xpub: BIP84_XPUB,
        derivationPath: "m/84h/0h/0h/0/0",
      },
      serverAccountId: BIP84_SERVICE_ID,
    });
  });

  it.each([
    ["legacy", "bitcoin", "m/44h/0h/1h", true],
    ["testnet native segwit", "bitcoin_testnet", "m/84h/1h/0h", true],
    ["segwit, refused by the service", "bitcoin", "m/49h/0h/0h", false],
    ["taproot, refused by the service", "bitcoin", "m/86h/0h/0h", false],
    ["of another coin type", "bitcoin", "m/84h/1h/0h", false],
    ["of a network the service does not derive", "litecoin", "m/84h/2h/0h", false],
  ])("serves a %s Bitcoin account: %s %s", (_, network, path, served) => {
    expect(
      portfolioAccountOf(mockUtxoAccountDescriptor({ network, path, xpub: BIP84_XPUB })) !==
        undefined,
    ).toBe(served);
  });

  it("leaves out an xpub the service would refuse, which would fail the whole registration call", () => {
    expect(portfolioAccountOf(mockUtxoAccountDescriptor({ xpub: "xpub-short" }))).toBeUndefined();
    const corrupted = `${BIP84_XPUB.slice(0, -1)}W`;
    expect(
      portfolioAccountOf(mockUtxoAccountDescriptor({ xpub: corrupted, path: "m/84h/0h/0h" })),
    ).toBe(undefined);
  });

  it("registers a Cardano account key as acct_xvk, read by the SHA-256 of it", () => {
    const descriptor = mockUtxoAccountDescriptor({
      network: "cardano",
      xpub: CARDANO_HEX,
      path: "m/1852h/1815h/0h",
    });
    expect(portfolioAccountOf(descriptor)).toEqual({
      registration: {
        type: "auto_derive",
        network: "cardano",
        xpub: CARDANO_XVK,
        derivationPath: "m/1852h/1815h/0h/0/0",
      },
      serverAccountId: CARDANO_SERVICE_ID,
    });
  });

  it("registers an address of a synchronized network under an id of ours", () => {
    expect(portfolioAccountOf(TRX)).toEqual({
      registration: {
        type: "account",
        accountId: `tron:${TRX.address}`,
        network: "tron",
        addresses: [TRX.address],
      },
      serverAccountId: `tron:${TRX.address}`,
    });
  });

  it("serves no network the service leaves unsynchronized, nor HyperCore despite its coin type 60", () => {
    expect(portfolioAccountOf(DOT)).toBeUndefined();
    expect(portfolioAccountOf(evm(1, "hypercore"))).toBeUndefined();
  });
});

describe("registrationKey", () => {
  it.each([ETH, BITCOIN, ADA, TRX])(
    "matches the registration sent with the one listed: %#",
    descriptor => {
      const registration = portfolioAccountOf(descriptor)?.registration;
      expect(registration).toBeDefined();
      if (!registration) return;
      expect(registrationKey(listed(registration, "id"))).toBe(registrationKey(registration));
    },
  );

  it("has no key for a shape the source never sends", () => {
    expect(registrationKey({ type: "solana", address: "9x" })).toBeUndefined();
    expect(registrationKey({ type: "account", network: "polkadot", addresses: ["1a"] })).toBe(
      undefined,
    );
    expect(registrationKey({ type: "auto_derive", network: "litecoin", xpub: "Ltub" })).toBe(
      undefined,
    );
  });
});

describe("missingRegistrations and unneededRegistrations", () => {
  it("registers what each family misses and removes only what this source would send", () => {
    const portfolio = synced([ETH, BITCOIN], {
      registrations: [
        ...(synced([ETH, BITCOIN]).registrations ?? []),
        { id: "old-tron", type: "account", network: "tron", addresses: ["Told"] },
        { id: "dot", type: "account", network: "polkadot", addresses: ["1a"] },
      ],
    });
    const descriptors = [ETH, BITCOIN, TRX, ADA];

    expect(missingRegistrations(portfolio, descriptors).map(each => each.type)).toEqual([
      "account",
      "auto_derive",
    ]);
    expect(unneededRegistrations(portfolio, descriptors).map(each => each.id)).toEqual([
      "old-tron",
    ]);
  });
});
