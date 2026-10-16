import type { AccountOperation } from "@ledgerhq/account-module-framework";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { tx } from "./test/fakeChain";
import type { UtxoState } from "./types";
import { applyTransactions, reconcile } from "./utxos";

const own = new Set(["me", "change"]);

const utxo = (txid: string, fields: Partial<UtxoState> = {}): UtxoState => ({
  txid,
  vout: 0,
  value: "1000",
  address: "me",
  height: 5,
  replaceable: false,
  ...fields,
});

describe("applyTransactions", () => {
  it("adds the account's outputs and removes what is spent, whatever the order", () => {
    const funding = tx("fund", {
      outputs: [
        { index: 0, address: "me", value: "1000" },
        { index: 1, address: "other", value: "5" },
        { index: 2, value: "0" },
      ],
    });
    const spending = tx("spend", {
      replaceable: true,
      inputs: [{ txid: "fund", vout: 0, address: "me", value: "1000" }],
      outputs: [{ index: 0, address: "change", value: "900" }],
    });
    const result = applyTransactions([utxo("old")], [spending, funding], own);
    expect(result.map(u => `${u.txid}:${u.vout}`).sort()).toEqual(["old:0", "spend:0"]);
    expect(result.find(u => u.txid === "spend")).toMatchObject({
      address: "change",
      replaceable: true,
    });
  });

  it("does not resurrect or duplicate an output read again", () => {
    const funding = tx("fund", { outputs: [{ index: 0, address: "me", value: "1000" }] });
    const first = applyTransactions([], [funding], own);
    expect(applyTransactions(first, [funding], own)).toHaveLength(1);
  });

  it("gives pending outputs no height, and spends nothing for a coinbase input", () => {
    const pending = tx("p", {
      block: null,
      inputs: [{ vout: 0, value: "0" }],
      outputs: [{ index: 0, address: "me", value: "50" }],
    });
    expect(applyTransactions([utxo("c")], [pending], own)).toEqual([
      utxo("c"),
      utxo("p", { value: "50", height: null }),
    ]);
  });
});

describe("reconcile", () => {
  const NOW = Date.parse("2026-01-01T00:00:00.000Z");
  const op = (hash: string, fields: Partial<AccountOperation> = {}): AccountOperation =>
    anOperation({
      id: `${hash}-OUT`,
      hash,
      type: "OUT",
      date: new Date(NOW),
      block: { height: 5, hash: "h5", time: new Date(NOW) },
      details: { inputs: [`${hash}-in`] },
      ...fields,
    });

  it("keeps the operations and the outputs they created", () => {
    const { operations, utxos } = reconcile([op("a")], [utxo("a")], NOW);
    expect(operations).toHaveLength(1);
    expect(utxos).toEqual([utxo("a")]);
  });

  it("drops the outputs of a replaced pending transaction", () => {
    const original = op("orig", {
      block: null,
      date: new Date(NOW - 1000),
      details: { inputs: ["x-0"] },
    });
    const replacement = op("repl", { block: null, details: { inputs: ["x-0"] } });
    const { utxos } = reconcile(
      [original, replacement],
      [
        utxo("orig", { height: null, replaceable: true }),
        utxo("repl", { height: null, replaceable: true }),
      ],
      NOW,
    );
    expect(utxos.map(u => u.txid)).toEqual(["repl"]);
  });

  it("drops an unconfirmed operation once past the given expiry", () => {
    const stale = op("s", {
      block: null,
      date: new Date(NOW - 10_000),
      details: { inputs: ["q-0"] },
    });
    expect(reconcile([stale], [], NOW, 5_000).operations).toEqual([]);
    expect(reconcile([stale], [], NOW, 60_000).operations).toEqual([stale]);
  });

  it("keeps the outputs of one operation among those spending the same inputs", () => {
    const a = op("a", {
      block: { height: 6, hash: "h6", time: new Date(NOW) },
      details: { inputs: ["x-0"] },
    });
    const b = op("b", { details: { inputs: ["x-0"] } });
    expect(reconcile([a, b], [utxo("a"), utxo("b")], NOW).utxos.map(u => u.txid)).toEqual(["a"]);
  });

  it("keeps a replaced pending output that cannot be replaced, and every output when no operation matches", () => {
    const original = op("orig", {
      block: null,
      date: new Date(NOW - 1000),
      details: { inputs: ["x-0"] },
    });
    const replacement = op("repl", { block: null, details: { inputs: ["x-0"] } });
    const kept = reconcile([original, replacement], [utxo("orig", { height: null })], NOW);
    expect(kept.utxos).toEqual([utxo("orig", { height: null })]);
    expect(reconcile([], [utxo("orphan")], NOW).utxos).toHaveLength(1);
  });
});
