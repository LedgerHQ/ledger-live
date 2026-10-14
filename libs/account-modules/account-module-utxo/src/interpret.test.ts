import { inputsOf, outpointOf, txToOperations } from "./interpret";
import { tx } from "./test/fakeChain";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";

const own = new Set(["recv1", "recv2", "change1"]);
const change = new Set(["change1"]);
const display = (address: string) => address;
const confirmedTx = (fields: Parameters<typeof tx>[1]) =>
  tx("tx", {
    block: { height: 10, hash: "h10", time: "2026-01-02T00:00:00.000Z" },
    fees: "100",
    ...fields,
  });

describe("txToOperations", () => {
  it("is an IN when the account receives on a receive address", () => {
    const [op] = txToOperations(
      confirmedTx({
        inputs: [{ txid: "p", vout: 0, address: "ext", value: "1000", sequence: 0 }],
        outputs: [
          { index: 0, address: "recv1", value: "600" },
          { index: 1, address: "ext2", value: "300" },
        ],
      }),
      own,
      change,
      display,
    );
    expect(op).toEqual({
      id: "tx-IN",
      hash: "tx",
      type: "IN",
      value: 600n,
      fee: 100n,
      asset: { type: "native" },
      senders: ["ext"],
      recipients: ["recv1"],
      block: { height: 10, hash: "h10", time: new Date("2026-01-02T00:00:00.000Z") },
      date: new Date("2026-01-02T00:00:00.000Z"),
      failed: false,
      details: { inputs: ["p-0"], replaceable: false },
    });
  });

  it("is an OUT net of the change, listing only the external recipients", () => {
    const ops = txToOperations(
      confirmedTx({
        replaceable: true,
        inputs: [{ txid: "p", vout: 1, address: "recv1", value: "1000", sequence: 5 }],
        outputs: [
          { index: 0, address: "ext", value: "700" },
          { index: 1, address: "change1", value: "200" },
        ],
      }),
      own,
      change,
      display,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      id: "tx-OUT",
      type: "OUT",
      value: 800n,
      recipients: ["ext"],
      details: { inputs: ["p-1"], sequence: 5, replaceable: true },
    });
  });

  it("is an OUT and an IN for a send to another receive address of the account", () => {
    const ops = txToOperations(
      confirmedTx({
        inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000", sequence: 0 }],
        outputs: [
          { index: 0, address: "recv2", value: "500" },
          { index: 1, address: "change1", value: "400" },
        ],
      }),
      own,
      change,
      display,
    );
    expect(ops.map(op => [op.type, op.value])).toEqual([
      ["OUT", 600n],
      ["IN", 500n],
    ]);
  });

  it("shows the change as recipient when it is all the transaction pays", () => {
    const [op] = txToOperations(
      confirmedTx({
        inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000" }],
        outputs: [{ index: 0, address: "change1", value: "900" }],
      }),
      own,
      change,
      display,
    );
    expect(op).toMatchObject({ type: "OUT", recipients: ["change1"] });
    expect(op?.details).not.toHaveProperty("sequence");
  });

  it("counts a change address the account received on without spending", () => {
    const [op] = txToOperations(
      confirmedTx({
        inputs: [{ address: "ext", vout: 0, value: "1000" }],
        outputs: [{ index: 0, address: "change1", value: "900" }],
      }),
      own,
      change,
      display,
    );
    expect(op).toMatchObject({ type: "IN", value: 900n, recipients: ["change1"] });
    expect(op?.details).toEqual({ inputs: [], replaceable: false });
  });

  it("lists a change output the account received while spending nothing of value", () => {
    const [, received] = txToOperations(
      confirmedTx({
        inputs: [{ txid: "p", vout: 0, address: "recv1", value: "0" }],
        outputs: [
          { index: 0, address: "ext", value: "0" },
          { index: 1, address: "change1", value: "50" },
          { index: 2, address: "recv2", value: "50" },
        ],
      }),
      own,
      change,
      display,
    );
    expect(received?.recipients).toEqual(["ext", "change1", "recv2"]);
  });

  it("skips outputs without an address and inputs without a previous transaction", () => {
    const ops = txToOperations(
      tx("tx", {
        block: null,
        inputs: [{ vout: 0, value: "0", sequence: 0xffffffff }],
        outputs: [
          { index: 0, value: "0" },
          { index: 1, address: "recv1", value: "50" },
        ],
      }),
      own,
      change,
      display,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "IN", block: null, senders: [], details: { inputs: [] } });
    expect(ops[0]?.date).toEqual(new Date("2026-01-01T00:00:00.000Z"));
  });

  it("is an OUT of everything spent for a transaction without outputs", () => {
    const ops = txToOperations(
      confirmedTx({ inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000" }] }),
      own,
      change,
      display,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ type: "OUT", value: 1000n, senders: ["recv1"] });
  });

  it("reports nothing for a transaction that does not involve the account", () => {
    expect(txToOperations(confirmedTx({}), own, change, display)).toEqual([]);
  });

  it("shows addresses as the coin module displays them", () => {
    const [op] = txToOperations(
      confirmedTx({
        inputs: [{ txid: "p", vout: 0, address: "prefix:ext", value: "1000" }],
        outputs: [{ index: 0, address: "prefix:mine", value: "900" }],
      }),
      new Set(["prefix:mine"]),
      new Set(),
      address => address.replace("prefix:", ""),
    );
    expect(op).toMatchObject({ senders: ["ext"], recipients: ["mine"] });
  });

  it("does not list the change as a recipient of a send with several outputs", () => {
    const [op] = txToOperations(
      confirmedTx({
        inputs: [{ txid: "p", vout: 0, address: "recv1", value: "1000" }],
        outputs: [
          { index: 0, address: "change1", value: "100" },
          { index: 1, address: "ext", value: "800" },
        ],
      }),
      own,
      change,
      display,
    );
    expect(op).toMatchObject({ type: "OUT", value: 900n, recipients: [] });
  });
});

describe("inputsOf", () => {
  it("reads the spent outpoints of an operation, none when it has no details", () => {
    expect(inputsOf(anOperation({ details: { inputs: [outpointOf("a", 1)] } }))).toEqual(["a-1"]);
    expect(inputsOf(anOperation())).toEqual([]);
  });
});
