import type { Operation, OperationType } from "@ledgerhq/types-live";
import {
  getOperationCounterpartyAddress,
  getAddressDirection,
} from "../getOperationCounterpartyAddress";

function makeOperation(
  type: OperationType,
  senders: string[] = [],
  recipients: string[] = [],
): Operation {
  return { type, senders, recipients } as unknown as Operation;
}

describe("getOperationCounterpartyAddress", () => {
  it.each<[OperationType, string[], string[], string]>([
    ["IN", ["sender-addr"], ["recipient-addr"], "sender-addr"],
    ["REVEAL", ["sender-addr"], ["recipient-addr"], "sender-addr"],
    ["REWARD_PAYOUT", ["sender-addr"], ["recipient-addr"], "sender-addr"],
    ["OUT", ["sender-addr"], ["recipient-addr"], "recipient-addr"],
    ["DELEGATE", ["sender-addr"], ["recipient-addr"], "recipient-addr"],
    ["UNDELEGATE", ["sender-addr"], ["recipient-addr"], "recipient-addr"],
    ["WITHDRAW", ["sender-addr"], ["recipient-addr"], "recipient-addr"],
    ["NONE", ["sender-addr"], ["recipient-addr"], "recipient-addr"],
    ["NFT_IN", ["sender-addr"], ["recipient-addr"], "recipient-addr"],
  ])("for %s returns the correct counterparty address", (type, senders, recipients, expected) => {
    expect(getOperationCounterpartyAddress(makeOperation(type, senders, recipients))).toBe(
      expected,
    );
  });

  it("returns empty string when senders is empty for IN", () => {
    expect(getOperationCounterpartyAddress(makeOperation("IN", [], ["r"]))).toBe("");
  });

  it("returns empty string when recipients is empty for OUT", () => {
    expect(getOperationCounterpartyAddress(makeOperation("OUT", ["s"], []))).toBe("");
  });
});

describe("getAddressDirection", () => {
  it.each<[OperationType, "from" | "to"]>([
    ["IN", "from"],
    ["REVEAL", "from"],
    ["REWARD_PAYOUT", "from"],
    ["OUT", "to"],
    ["DELEGATE", "to"],
    ["UNDELEGATE", "to"],
    ["WITHDRAW", "to"],
    ["NONE", "to"],
  ])("for %s returns '%s'", (type, expected) => {
    expect(getAddressDirection(type)).toBe(expected);
  });
});
