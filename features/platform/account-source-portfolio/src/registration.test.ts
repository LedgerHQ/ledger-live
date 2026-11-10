import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { BTC, DOT, ETH, POLYGON, evm, listed, synced } from "./internals/fakeService.mock";
import {
  missingRegistrations,
  portfolioAccountOf,
  registrationKey,
  unneededRegistrations,
} from "./registration";

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

  it("serves no network the service leaves unsynchronized, nor HyperCore despite its coin type 60", () => {
    expect(portfolioAccountOf(BTC)).toBeUndefined();
    expect(portfolioAccountOf(DOT)).toBeUndefined();
    expect(portfolioAccountOf(evm(1, "hypercore"))).toBeUndefined();
  });
});

describe("registrationKey", () => {
  it("matches the registration sent with the one listed", () => {
    const registration = portfolioAccountOf(ETH)?.registration;
    expect(registration).toBeDefined();
    if (!registration) return;
    expect(registrationKey(listed(registration, "id"))).toBe(registrationKey(registration));
  });

  it("has no key for a shape the source never sends", () => {
    expect(registrationKey({ type: "solana", address: "9x" })).toBeUndefined();
    expect(registrationKey({ type: "account", network: "polkadot", addresses: ["1a"] })).toBe(
      undefined,
    );
    expect(registrationKey({ type: "auto_derive", network: "bitcoin", xpub: "xpub" })).toBe(
      undefined,
    );
  });
});

describe("missingRegistrations and unneededRegistrations", () => {
  it("registers what the accounts miss and removes only what this source would send", () => {
    const portfolio = synced([ETH], {
      registrations: [
        ...(synced([ETH]).registrations ?? []),
        { id: "old-evm", type: "evm", address: evm(9).address },
        { id: "dot", type: "account", network: "polkadot", addresses: ["1a"] },
      ],
    });
    const descriptors = [ETH, POLYGON, evm(2)];

    expect(missingRegistrations(portfolio, descriptors)).toEqual([
      { type: "evm", address: evm(2).address },
    ]);
    expect(unneededRegistrations(portfolio, descriptors).map(each => each.id)).toEqual(["old-evm"]);
  });
});
