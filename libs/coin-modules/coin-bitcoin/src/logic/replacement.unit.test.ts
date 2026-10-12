import { BigNumber } from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import { BTC_CHANGE, BTC_RECIPIENT, fakeExplorer } from "../test/fakeExplorer";
import { cryptoFor } from "./currency";
import {
  fetchOriginalTx,
  getReplacementContext,
  isReplaceable,
  minReplacementFeeFor,
  minReplacementFeePerByteFor,
  type OriginalTx,
} from "./replacement";

const crypto = cryptoFor("bitcoin");

function txPaying(address: string, value: number, prevTxid?: string, sequence = 0): Transaction {
  const tx = new Transaction();
  tx.addInput(prevTxid ? Buffer.from(prevTxid, "hex").reverse() : Buffer.alloc(32, 7), 0, sequence);
  tx.addOutput(crypto.toOutputScript(address), value);
  return tx;
}

/** A funding transaction, and one replaceable spending it with a fee of 1 000 sats. */
function chain(sequence = 0) {
  const prev = txPaying(BTC_CHANGE, 100_000);
  const original = txPaying(BTC_RECIPIENT, 99_000, prev.getId(), sequence);
  return {
    prev,
    original,
    txHex: { [prev.getId()]: prev.toHex(), [original.getId()]: original.toHex() },
  };
}

describe("fetchOriginalTx", () => {
  it("decodes the transaction and the values and addresses of its inputs", async () => {
    const { prev, original, txHex } = chain();
    const tx = await fetchOriginalTx(fakeExplorer({ txHex }), crypto, original.getId());
    expect(tx).toMatchObject({
      txid: original.getId(),
      fee: 1_000n,
      vsize: original.virtualSize(),
      inputs: [{ txid: prev.getId(), vout: 0, value: 100_000n, address: BTC_CHANGE, sequence: 0 }],
      outputs: [{ index: 0, address: BTC_RECIPIENT, value: 99_000n }],
    });
    expect(tx.feePerByte.toNumber()).toBe(Math.ceil(1_000 / original.virtualSize()));
  });

  it("fails clearly when the transaction cannot be fetched", async () => {
    await expect(fetchOriginalTx(fakeExplorer(), crypto, "gone")).rejects.toThrow(
      "Original transaction gone could not be fetched",
    );
  });

  it("refuses an input pointing at an output that does not exist", async () => {
    const prev = txPaying(BTC_CHANGE, 100_000);
    const original = new Transaction();
    original.addInput(Buffer.from(prev.getId(), "hex").reverse(), 5, 0);
    original.addOutput(crypto.toOutputScript(BTC_RECIPIENT), 1);
    const explorer = fakeExplorer({
      txHex: { [prev.getId()]: prev.toHex(), [original.getId()]: original.toHex() },
    });
    await expect(fetchOriginalTx(explorer, crypto, original.getId())).rejects.toThrow(
      "Output index 5 does not exist",
    );
  });

  it("reports an address it cannot decode as null", async () => {
    const prev = txPaying(BTC_CHANGE, 100_000);
    const original = new Transaction();
    original.addInput(Buffer.from(prev.getId(), "hex").reverse(), 0, 0);
    original.addOutput(Buffer.from("6a0100", "hex"), 0);
    const explorer = fakeExplorer({
      txHex: { [prev.getId()]: prev.toHex(), [original.getId()]: original.toHex() },
    });
    const tx = await fetchOriginalTx(explorer, crypto, original.getId());
    expect(tx.outputs[0].address).toBeNull();
  });
});

const original = (overrides: Partial<OriginalTx> = {}): OriginalTx => ({
  txid: "t",
  vsize: 200,
  fee: 2_000n,
  feePerByte: new BigNumber(10),
  inputs: [{ txid: "p", vout: 0, value: 1n, address: null, sequence: 0 }],
  outputs: [],
  ...overrides,
});

describe("replacement fee rules", () => {
  it("is replaceable when an input signals it", () => {
    expect(isReplaceable(original())).toBe(true);
    expect(
      isReplaceable(
        original({
          inputs: [{ txid: "p", vout: 0, value: 1n, address: null, sequence: 0xfffffffe }],
        }),
      ),
    ).toBe(false);
  });

  it("pays more in total and bumps the rate by the incremental relay fee", () => {
    // absolute: 2000 + 1*200 = 2200; rate: (10+1)*200 = 2200
    expect(minReplacementFeeFor(original(), new BigNumber(1))).toBe(2_200n);
    // a zero incremental fee still pays one sat more
    expect(
      minReplacementFeeFor(original({ feePerByte: new BigNumber(0), fee: 0n }), new BigNumber(0)),
    ).toBe(1n);
  });

  it("starts a speed up strictly above the replaced rate", () => {
    expect(minReplacementFeePerByteFor(original(), new BigNumber(1)).toNumber()).toBe(11);
    expect(minReplacementFeePerByteFor(original(), new BigNumber(0)).toNumber()).toBe(11);
  });
});

describe("getReplacementContext", () => {
  it("prices the replacement against the replaced transaction and its conflicts", async () => {
    const { original: tx, txHex } = chain();
    const conflicting = chain();
    const richer = txPaying(BTC_RECIPIENT, 50_000, conflicting.prev.getId());
    const explorer = fakeExplorer({
      txHex: { ...txHex, ...conflicting.txHex, [richer.getId()]: richer.toHex() },
      incrementalFee: "0.00001000",
    });

    const context = await getReplacementContext(explorer, crypto, {
      txid: tx.getId(),
      conflictingTxIds: [tx.getId(), richer.getId(), "unknown"],
    });

    expect(context.originalFee).toBe(1_000n);
    expect(context.originalVsize).toBe(tx.virtualSize());
    expect(context.incrementalFeePerByte.toNumber()).toBe(1);
    // the richer conflict (50 000 sats of fee) sets the floor
    expect(context.minReplacementFee).toBeGreaterThan(50_000n);
    expect(context.minReplacementFeePerByte.gt(context.original.feePerByte)).toBe(true);
  });

  it("ignores a conflicting transaction that does not signal replaceability", async () => {
    const { original: tx, txHex } = chain();
    const other = chain(0xffffffff);
    const explorer = fakeExplorer({ txHex: { ...txHex, ...other.txHex } });
    const alone = await getReplacementContext(explorer, crypto, { txid: tx.getId() });
    const withOther = await getReplacementContext(explorer, crypto, {
      txid: tx.getId(),
      conflictingTxIds: [other.original.getId()],
    });
    expect(withOther.minReplacementFee).toBe(alone.minReplacementFee);
  });

  it("refuses a transaction that does not signal replaceability", async () => {
    const { original: tx, txHex } = chain(0xffffffff);
    await expect(
      getReplacementContext(fakeExplorer({ txHex }), crypto, { txid: tx.getId() }),
    ).rejects.toThrow("Transaction is not RBF-enabled");
  });
});
