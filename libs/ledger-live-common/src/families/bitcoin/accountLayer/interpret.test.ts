import { BigNumber } from "bignumber.js";
import type { BitcoinTxDetails } from "@ledgerhq/coin-bitcoin/api";
import {
  bchToCashaddrAddressWithoutPrefix,
  displayAddress,
  inferTransactionSequenceNumberFromInputs,
  txToOperations,
} from "./interpret";

const ACCOUNT = "js:2:bitcoin:xpub:native_segwit";
const own = new Set(["recv1", "recv2", "change1"]);
const change = new Set(["change1"]);

const tx = (overrides: Partial<BitcoinTxDetails>): BitcoinTxDetails => ({
  id: "tx",
  receivedAt: "2026-01-01T00:00:00Z",
  block: { height: 10, hash: "h10", time: "2026-01-02T00:00:00Z" },
  fees: "100",
  inputs: [],
  outputs: [],
  ...overrides,
});

describe("display", () => {
  it("strips the Bitcoin Cash prefix", () => {
    expect(bchToCashaddrAddressWithoutPrefix("bitcoincash:qabc")).toBe("qabc");
    expect(bchToCashaddrAddressWithoutPrefix("qabc")).toBe("qabc");
    expect(bchToCashaddrAddressWithoutPrefix("")).toBe("");
    expect(displayAddress("bitcoin_cash", "bitcoincash:qabc")).toBe("qabc");
    expect(displayAddress("bitcoin", "bitcoincash:qabc")).toBe("bitcoincash:qabc");
  });
});

describe("inferTransactionSequenceNumberFromInputs", () => {
  it("is the lowest nSequence of the account's inputs", () => {
    expect(inferTransactionSequenceNumberFromInputs([])).toBeUndefined();
    expect(inferTransactionSequenceNumberFromInputs([{ sequence: 7 }, { sequence: 3 }])).toBe(3);
    expect(
      inferTransactionSequenceNumberFromInputs([{ sequence: undefined as unknown as number }]),
    ).toBe(0xfffffffe);
  });
});

describe("txToOperations", () => {
  it("is an IN when the account receives on a receive address", () => {
    const [op] = txToOperations(
      tx({
        inputs: [{ txid: "p", vout: 0, address: "ext", value: "1000", sequence: 0 }],
        outputs: [
          { index: 0, address: "recv1", value: "600" },
          { index: 1, address: "ext2", value: "300" },
        ],
      }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    expect(op).toMatchObject({
      type: "IN",
      value: new BigNumber(600),
      hash: "tx",
      senders: ["ext"],
      recipients: ["recv1"],
      blockHeight: 10,
      blockHash: "h10",
      fee: new BigNumber(100),
      extra: { inputs: ["p-0"] },
      transactionSequenceNumber: new BigNumber(0),
    });
    expect(op.date).toEqual(new Date("2026-01-02T00:00:00Z"));
  });

  it("is an OUT net of the change, listing only the external recipients", () => {
    const ops = txToOperations(
      tx({
        inputs: [{ txid: "p", vout: 1, address: "recv1", value: "1000", sequence: 5 }],
        outputs: [
          { index: 0, address: "ext", value: "700" },
          { index: 1, address: "change1", value: "200" },
        ],
      }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      type: "OUT",
      value: new BigNumber(800),
      recipients: ["ext"],
      transactionSequenceNumber: new BigNumber(5),
    });
  });

  it("is an OUT and an IN for a send to another receive address of the account", () => {
    const ops = txToOperations(
      tx({
        inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000", sequence: 0 }],
        outputs: [
          { index: 0, address: "recv2", value: "500" },
          { index: 1, address: "change1", value: "400" },
        ],
      }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    expect(ops.map(op => [op.type, op.value.toNumber()])).toEqual([
      ["OUT", 600],
      ["IN", 500],
    ]);
  });

  it("shows the change as recipient when it is all the transaction pays", () => {
    const [op] = txToOperations(
      tx({
        inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000", sequence: 0 }],
        outputs: [{ index: 0, address: "change1", value: "900" }],
      }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    expect(op).toMatchObject({ type: "OUT", recipients: ["change1"] });
  });

  it("counts a change address the account received on without spending", () => {
    const [op] = txToOperations(
      tx({
        inputs: [{ address: "ext", vout: 0, value: "1000", sequence: 0 }],
        outputs: [{ index: 0, address: "change1", value: "900" }],
      }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    expect(op).toMatchObject({ type: "IN", value: new BigNumber(900), recipients: ["change1"] });
    expect(op.extra).toEqual({ inputs: [] });
  });

  it("ignores OP_RETURN and coinbase entries, and uses the mempool date of a pending tx", () => {
    const ops = txToOperations(
      tx({
        block: null,
        inputs: [{ vout: 0, value: "0", sequence: 0xffffffff }],
        outputs: [
          { index: 0, address: "unknown", value: "0" },
          { index: 1, value: "0" },
          { index: 2, address: "recv1", value: "50" },
        ],
      }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "IN", blockHeight: undefined, senders: [] });
    expect(ops[0].date).toEqual(new Date("2026-01-01T00:00:00Z"));
  });

  it("is an OUT of everything spent for a transaction without outputs", () => {
    const ops = txToOperations(
      tx({ inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000", sequence: 0 }] }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "OUT", value: new BigNumber(1000), senders: ["recv1"] });
  });

  it("reports nothing for a transaction that does not involve the account", () => {
    expect(txToOperations(tx({ outputs: [] }), "bitcoin", ACCOUNT, own, change)).toEqual([]);
  });

  it("shows Bitcoin Cash addresses without their prefix", () => {
    const [op] = txToOperations(
      tx({
        inputs: [{ txid: "p", vout: 0, address: "bitcoincash:qext", value: "1000", sequence: 0 }],
        outputs: [{ index: 0, address: "bitcoincash:qmine", value: "900" }],
      }),
      "bitcoin_cash",
      ACCOUNT,
      new Set(["bitcoincash:qmine"]),
      new Set(),
    );
    expect(op).toMatchObject({ senders: ["qext"], recipients: ["qmine"] });
  });

  it("does not list the change as a recipient of a send with several outputs", () => {
    const [op] = txToOperations(
      tx({
        inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000", sequence: 0 }],
        outputs: [
          { index: 0, address: "change1", value: "100" },
          { index: 1, address: "ext", value: "800" },
        ],
      }),
      "bitcoin",
      ACCOUNT,
      own,
      change,
    );
    // ext is the last output, so the legacy change heuristic does not take it as a recipient
    expect(op).toMatchObject({ type: "OUT", value: new BigNumber(900), recipients: [] });
  });
});
