import { findContactOperationsToAddresses } from "./findContactOperationsToAddresses";
import type { ContactIncomingOperation, ContactOutgoingOperation, ContactOperation } from "./types";

const ethAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const eth = { address: ethAddress, currencyId: "ethereum" } as const;

function incoming(
  overrides: Partial<Omit<ContactIncomingOperation, "type">> = {},
): ContactIncomingOperation {
  return {
    id: "op-in",
    type: "IN",
    senders: [ethAddress],
    date: 1000,
    currencyId: "ethereum",
    ...overrides,
  };
}

function outgoing(
  overrides: Partial<Omit<ContactOutgoingOperation, "type">> = {},
): ContactOutgoingOperation {
  return {
    id: "op-out",
    type: "OUT",
    recipients: [ethAddress],
    date: 1000,
    currencyId: "ethereum",
    ...overrides,
  };
}

function find(operations: readonly ContactOperation[]) {
  return findContactOperationsToAddresses([eth], operations);
}

describe("findContactOperationsToAddresses", () => {
  it("matches an outgoing operation on its recipients", () => {
    const op = outgoing();
    expect(find([op])).toEqual([op]);
  });

  it("matches an incoming operation on its senders", () => {
    const op = incoming();
    expect(find([op])).toEqual([op]);
  });

  it("matches EVM addresses case-insensitively", () => {
    const op = incoming({ senders: ["0x1AD23B2CF8D2E0591EA417EB82F7CD9746C53034"] });
    expect(find([op])).toEqual([op]);
  });

  it("ignores a matching address on a different currency", () => {
    expect(find([outgoing({ currencyId: "ethereum/erc20/usd_coin" })])).toEqual([]);
  });

  it("returns no matches when there are no addresses", () => {
    expect(findContactOperationsToAddresses([], [incoming(), outgoing()])).toEqual([]);
  });

  it("keeps matching IN and OUT operations and drops the rest", () => {
    const matchIn = incoming({ id: "in-hit" });
    const matchOut = outgoing({ id: "out-hit" });
    const miss = outgoing({
      id: "out-miss",
      recipients: ["0xdeadbeef00000000000000000000000000000000"],
    });
    expect(find([miss, matchIn, matchOut])).toEqual([matchIn, matchOut]);
  });
});
