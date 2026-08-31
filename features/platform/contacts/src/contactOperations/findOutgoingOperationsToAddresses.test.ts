import { findOutgoingOperationsToAddresses } from "./findOutgoingOperationsToAddresses";
import type { OutgoingOperation } from "./types";

const ethAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const ethAddressChecksummed = "0x1AD23B2CF8D2E0591EA417EB82F7CD9746C53034";

function operation(overrides: Partial<OutgoingOperation> = {}): OutgoingOperation {
  return {
    id: "op-1",
    recipientAddress: ethAddress,
    date: 1000,
    currencyId: "ethereum",
    ...overrides,
  };
}

describe("findOutgoingOperationsToAddresses", () => {
  it("matches EVM addresses case-insensitively", () => {
    const op = operation({ recipientAddress: ethAddressChecksummed });

    expect(
      findOutgoingOperationsToAddresses([{ address: ethAddress, currencyId: "ethereum" }], [op]),
    ).toEqual([op]);
  });

  it("ignores operations to an unknown recipient", () => {
    const op = operation({ recipientAddress: "0xdeadbeef00000000000000000000000000000000" });

    expect(
      findOutgoingOperationsToAddresses([{ address: ethAddress, currencyId: "ethereum" }], [op]),
    ).toEqual([]);
  });

  it("ignores a matching address on a different currency", () => {
    const op = operation({ currencyId: "ethereum/erc20/usd_coin" });

    expect(
      findOutgoingOperationsToAddresses([{ address: ethAddress, currencyId: "ethereum" }], [op]),
    ).toEqual([]);
  });

  it("returns no matches when the contact has no addresses", () => {
    expect(findOutgoingOperationsToAddresses([], [operation()])).toEqual([]);
  });
});
