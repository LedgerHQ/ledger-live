import { BigNumber } from "bignumber.js";
import type { BitcoinTxDetails } from "@ledgerhq/coin-bitcoin/api";
import type { BitcoinStateUtxo, BtcOperation } from "../types";
import { applyConfirmedTxs, isRbfTx, reconcile, withMempool } from "./utxos";

const own = new Set(["me", "change"]);
const change = new Set(["change"]);

const tx = (id: string, overrides: Partial<BitcoinTxDetails> = {}): BitcoinTxDetails => ({
  id,
  receivedAt: "2026-01-01T00:00:00Z",
  block: { height: 5, hash: `h${id}`, time: "2026-01-01T00:00:00Z" },
  fees: "0",
  inputs: [],
  outputs: [],
  ...overrides,
});

const utxo = (
  txid: string,
  vout = 0,
  overrides: Partial<BitcoinStateUtxo> = {},
): BitcoinStateUtxo => ({
  txid,
  vout,
  value: "1000",
  address: "me",
  blockHeight: 5,
  rbf: false,
  ...overrides,
});

describe("isRbfTx", () => {
  it("is true when an input signals replaceability", () => {
    expect(isRbfTx(tx("a", { inputs: [{ vout: 0, value: "1", sequence: 0 }] }))).toBe(true);
    expect(isRbfTx(tx("a", { inputs: [{ vout: 0, value: "1", sequence: 0xfffffffe }] }))).toBe(
      false,
    );
  });
});

describe("applyConfirmedTxs", () => {
  it("adds the account's outputs and removes what is spent, whatever the order", () => {
    const funding = tx("fund", {
      outputs: [
        { index: 0, address: "me", value: "1000" },
        { index: 1, address: "other", value: "5" },
      ],
    });
    const spending = tx("spend", {
      inputs: [{ txid: "fund", vout: 0, address: "me", value: "1000", sequence: 0 }],
      outputs: [{ index: 0, address: "change", value: "900" }],
    });
    const result = applyConfirmedTxs([utxo("old")], [spending, funding], own);
    expect(result.map(u => `${u.txid}:${u.vout}`).sort()).toEqual(["old:0", "spend:0"]);
    expect(result.find(u => u.txid === "spend")).toMatchObject({ address: "change", rbf: true });
  });

  it("does not resurrect or duplicate an output fetched again", () => {
    const funding = tx("fund", { outputs: [{ index: 0, address: "me", value: "1000" }] });
    const first = applyConfirmedTxs([], [funding], own);
    expect(applyConfirmedTxs(first, [funding], own)).toHaveLength(1);
  });
});

describe("withMempool", () => {
  it("adds pending outputs and removes pending spends", () => {
    const pendingSpend = tx("p1", {
      block: null,
      inputs: [{ txid: "c1", vout: 0, address: "me", value: "1000", sequence: 0 }],
      outputs: [
        { index: 0, address: "change", value: "800" },
        { index: 1, address: "me", value: "50" },
      ],
    });
    const spendsPending = tx("p2", {
      block: null,
      inputs: [{ txid: "p1", vout: 1, address: "me", value: "50", sequence: 0 }],
    });
    const result = withMempool([utxo("c1"), utxo("c2")], [pendingSpend, spendsPending], own);
    expect(result.map(u => [u.txid, u.vout, u.pending])).toEqual([
      ["c2", 0, false],
      ["p1", 0, true],
    ]);
  });
});

describe("reconcile", () => {
  const op = (hash: string, overrides: Partial<BtcOperation> = {}): BtcOperation =>
    ({
      id: `${hash}-OUT`,
      hash,
      type: "OUT",
      date: new Date(),
      blockHeight: 5,
      extra: { inputs: [`${hash}-in`] },
      ...overrides,
    }) as BtcOperation;
  const raw = (txid: string, pending: boolean, overrides: Partial<BitcoinStateUtxo> = {}) => ({
    ...utxo(txid, 0, overrides),
    pending,
  });

  it("maps the spendable outputs and keeps the operations", () => {
    const { operations, utxos } = reconcile(
      [op("a")],
      [raw("a", false, { address: "change" })],
      "bitcoin",
      change,
    );
    expect(operations).toHaveLength(1);
    expect(utxos).toEqual([
      {
        hash: "a",
        outputIndex: 0,
        blockHeight: 5,
        address: "change",
        value: new BigNumber(1000),
        rbf: false,
        isChange: true,
      },
    ]);
  });

  it("drops the outputs of a replaced pending transaction", () => {
    const now = Date.now();
    const original = op("orig", {
      blockHeight: undefined,
      date: new Date(now - 1000),
      extra: { inputs: ["x-0"] },
    });
    const replacement = op("repl", {
      blockHeight: undefined,
      date: new Date(now),
      extra: { inputs: ["x-0"] },
    });
    const { utxos } = reconcile(
      [original, replacement],
      [raw("orig", true, { rbf: true }), raw("repl", true, { rbf: true })],
      "bitcoin",
      change,
      now,
    );
    expect(utxos.map(u => u.hash)).toEqual(["repl"]);
  });

  it("keeps one operation's outputs among those spending the same inputs", () => {
    const a = op("a", { extra: { inputs: ["x-0"] }, blockHeight: 6 });
    const b = op("b", { extra: { inputs: ["x-0"] }, blockHeight: 5 });
    const { utxos } = reconcile([a, b], [raw("a", false), raw("b", false)], "bitcoin", change);
    expect(utxos.map(u => u.hash)).toEqual(["a"]);
  });

  it("prefers the confirmed one, then the latest among same-height ones", () => {
    const now = Date.now();
    const confirmed = op("c", { extra: { inputs: ["y-0"] }, blockHeight: 5 });
    const pending = op("p", {
      extra: { inputs: ["y-0"] },
      blockHeight: undefined,
      date: new Date(now),
    });
    expect(
      reconcile(
        [pending, confirmed],
        [raw("c", false), raw("p", false)],
        "bitcoin",
        change,
        now,
      ).utxos.map(u => u.hash),
    ).toEqual(["c"]);

    const early = op("e", { extra: { inputs: ["z-0"] }, blockHeight: 7, date: new Date(now - 10) });
    const late = op("l", { extra: { inputs: ["z-0"] }, blockHeight: 7, date: new Date(now) });
    expect(
      reconcile(
        [early, late],
        [raw("e", false), raw("l", false)],
        "bitcoin",
        change,
        now,
      ).utxos.map(u => u.hash),
    ).toEqual(["l"]);
  });

  it("keeps the outputs of an operation spending nothing, and every output when no operation matches", () => {
    const received = op("r", { type: "IN", extra: {} });
    const { utxos } = reconcile(
      [received],
      [raw("r", false), raw("orphan", false)],
      "bitcoin",
      change,
    );
    expect(utxos.map(u => u.hash)).toEqual(["r"]);
    expect(reconcile([], [raw("orphan", false)], "bitcoin", change).utxos).toHaveLength(1);
  });

  it("shows Bitcoin Cash addresses without their prefix, a pending output without height", () => {
    const { utxos } = reconcile(
      [],
      [raw("a", true, { address: "bitcoincash:qme" })],
      "bitcoin_cash",
      new Set(),
    );
    expect(utxos[0]).toMatchObject({ address: "qme", blockHeight: null, isChange: false });
  });
});
