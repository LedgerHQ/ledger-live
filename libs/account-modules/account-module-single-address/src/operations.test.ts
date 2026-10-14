import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";
import {
  isFailedIncoming,
  isSequenceTaken,
  nextHeight,
  nextSequence,
  sequenceOf,
  toAccountOperation,
} from "./operations";

const blockTime = new Date("2026-01-02T00:00:00.000Z");
const txDate = new Date("2026-01-01T00:00:00.000Z");

const aCoinOperation = (
  fields: Partial<Omit<Operation, "tx">> = {},
  tx: Partial<Operation["tx"]> = {},
): Operation => ({
  id: "coin-op",
  type: "OUT",
  senders: ["address"],
  recipients: ["recipient"],
  value: 100n,
  asset: { type: "native" },
  ...fields,
  tx: {
    hash: "hash",
    block: { height: 10, hash: "block-10", time: blockTime, parent: { height: 9, hash: "b9" } },
    fees: 5n,
    date: txDate,
    failed: false,
    ...tx,
  },
});

const token = { type: "erc20", assetReference: "0xtoken" };

describe("toAccountOperation", () => {
  it("maps a coin operation onto the account operation of its transaction", () => {
    expect(toAccountOperation(aCoinOperation())).toEqual({
      id: "coin-op",
      hash: "hash",
      type: "OUT",
      value: 105n,
      fee: 5n,
      asset: { type: "native" },
      senders: ["address"],
      recipients: ["recipient"],
      block: { height: 10, hash: "block-10", time: blockTime },
      date: txDate,
      failed: false,
    });
  });

  it.each([
    "OUT",
    "FEES",
    "DELEGATE",
    "UNDELEGATE",
    "REDELEGATE",
    "CONTRACT_CALL",
    "UPDATE_ACCOUNT",
  ])("adds the fee to the native value of a %s operation", type => {
    expect(toAccountOperation(aCoinOperation({ type })).value).toBe(105n);
  });

  it("keeps the native value of an incoming operation, whose fee someone else paid", () => {
    expect(toAccountOperation(aCoinOperation({ type: "IN" })).value).toBe(100n);
  });

  it("keeps the token value of an outgoing token operation, whose fee is paid in the native asset", () => {
    expect(toAccountOperation(aCoinOperation({ asset: token })).value).toBe(100n);
  });

  it("values a failed operation at its fee only", () => {
    const operation = toAccountOperation(aCoinOperation({ asset: token }, { failed: true }));
    expect(operation).toMatchObject({ value: 5n, failed: true });
  });

  it("keeps the details of the coin operation", () => {
    const operation = toAccountOperation(aCoinOperation({ details: { sequence: 3n } }));
    expect(operation.details).toEqual({ sequence: 3n });
  });

  it("adds the memo to the details", () => {
    const memo = { type: "none" } as const;
    expect(toAccountOperation(aCoinOperation({ memo })).details).toEqual({ memo });
    expect(toAccountOperation(aCoinOperation({ memo, details: { sequence: 3n } })).details).toEqual(
      { sequence: 3n, memo },
    );
  });
});

describe("isFailedIncoming", () => {
  it("tells a failed incoming operation, whose fee the account did not pay", () => {
    expect(isFailedIncoming(aCoinOperation({ type: "IN" }, { failed: true }))).toBe(true);
    expect(isFailedIncoming(aCoinOperation({ type: "IN" }))).toBe(false);
    expect(isFailedIncoming(aCoinOperation({ type: "OUT" }, { failed: true }))).toBe(false);
  });
});

describe("nextHeight", () => {
  it("resumes above the highest block holding an operation", () => {
    const operations = [
      anOperation({ id: "pending", block: null }),
      anOperation({ id: "high", block: { height: 12, hash: "b12", time: blockTime } }),
      anOperation({ id: "low", block: { height: 7, hash: "b7", time: blockTime } }),
    ];
    expect(nextHeight(operations)).toBe(13);
  });

  it("starts from height 0 without any operation in a block", () => {
    expect(nextHeight([])).toBe(0);
    expect(nextHeight([anOperation({ block: null })])).toBe(0);
  });
});

describe("sequenceOf", () => {
  it.each([
    [3n, 3n],
    [3, 3n],
    ["3", 3n],
  ])("reads the sequence %p", (sequence, expected) => {
    expect(sequenceOf(anOperation({ details: { sequence } }))).toBe(expected);
  });

  it.each([undefined, 1.5, "-1", "0x3", null])("ignores the sequence %p", sequence => {
    expect(sequenceOf(anOperation({ details: { sequence } }))).toBeUndefined();
  });

  it("ignores an operation without details", () => {
    expect(sequenceOf(anOperation())).toBeUndefined();
  });
});

describe("nextSequence", () => {
  const pending = (...sequences: string[]) =>
    sequences.map(sequence => anOperation({ details: { sequence } }));

  it("bumps the network sequence past the ones pending operations took", () => {
    expect(nextSequence(4n, pending("4", "6", "5"))).toBe(7n);
  });

  it("keeps the network sequence once the network saw the pending operations", () => {
    expect(nextSequence(8n, pending("6", "7"))).toBe(8n);
    expect(nextSequence(8n, [anOperation()])).toBe(8n);
  });
});

describe("isSequenceTaken", () => {
  const optimistic = anOperation({ optimistic: true, block: null, details: { sequence: "5" } });

  it("settles an optimistic operation whose sequence a synced transaction of the account took", () => {
    const sent = anOperation({ type: "OUT", details: { sequence: 5n } });
    expect(isSequenceTaken(optimistic, [sent])).toBe(true);
    expect(isSequenceTaken(optimistic, [{ ...sent, details: { sequence: 9 } }])).toBe(true);
  });

  it("keeps an optimistic operation whose sequence is still free", () => {
    const synced = [
      anOperation({ type: "OUT", details: { sequence: 4n } }),
      anOperation({ type: "OUT" }),
      anOperation({ type: "IN", details: { sequence: 9n } }),
    ];
    expect(isSequenceTaken(optimistic, synced)).toBe(false);
  });

  it("keeps an optimistic operation without a sequence", () => {
    const sent = anOperation({ type: "OUT", details: { sequence: 9n } });
    expect(isSequenceTaken(anOperation({ optimistic: true, block: null }), [sent])).toBe(false);
  });
});
