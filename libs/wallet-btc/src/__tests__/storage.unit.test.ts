import BitcoinLikeStorage from "../storage";
import type { TX } from "../storage/types";

const makeTx = (over: Partial<TX> = {}): TX =>
  ({
    id: "tx1",
    received_at: "2024-01-01T00:00:00Z",
    account: 0,
    index: 0,
    address: "addr-a",
    inputs: [],
    outputs: [
      {
        output_index: 0,
        value: "10000",
        address: "addr-a",
        output_hash: "tx1",
        block_height: 100,
        rbf: false,
      },
    ],
    block: { hash: "b100", height: 100, time: "2024-01-01T00:00:00Z" },
    ...over,
  }) as unknown as TX;

describe("BitcoinLikeStorage", () => {
  it("appends txs and exposes them via getTxs / txsSize", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([makeTx()]);
    expect(s.txsSize()).toBe(1);
    expect(s.getTxs()[0].id).toBe("tx1");
    expect(s.hasTx({ account: 0, index: 0 })).toBe(true);
    expect(s.hasTx({ account: 9, index: 9 })).toBe(false);
  });

  it("dedups an already-stored tx", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([makeTx()]);
    s.appendTxs([makeTx()]);
    expect(s.txsSize()).toBe(1);
  });

  it("returns an unspent output as a UTXO for its address", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([makeTx()]);
    const utxos = s.getAddressUnspentUtxos({ address: "addr-a", account: 0, index: 0 } as any);
    expect(utxos).toHaveLength(1);
    expect(utxos[0].value).toBe("10000");
  });

  it("does not return an output that is spent by a later tx input", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([
      makeTx(),
      makeTx({
        id: "tx2",
        address: "addr-b",
        account: 0,
        index: 1,
        inputs: [
          { output_hash: "tx1", output_index: 0, value: "10000", address: "addr-a", sequence: 0 },
        ] as any,
        outputs: [
          {
            output_index: 0,
            value: "9000",
            address: "addr-b",
            output_hash: "tx2",
            block_height: 101,
            rbf: false,
          },
        ] as any,
      }),
    ]);
    const spent = s.getAddressUnspentUtxos({ address: "addr-a", account: 0, index: 0 } as any);
    expect(spent).toHaveLength(0);
  });

  it("reports the highest block height and hash", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([makeTx(), makeTx({ id: "tx2", block: { hash: "b200", height: 200, time: "x" } })]);
    expect(s.getHighestBlockHeightAndHash()).toMatchObject({ height: 200, hash: "b200" });
  });

  it("lists unique addresses, filtered by account", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([makeTx(), makeTx({ id: "tx2", account: 1, index: 0, address: "addr-c" })]);
    const all = s.getUniquesAddresses({});
    expect(all.map(a => a.address)).toEqual(expect.arrayContaining(["addr-a", "addr-c"]));
    const acc1 = s.getUniquesAddresses({ account: 1 });
    expect(acc1.every(a => a.account === 1)).toBe(true);
  });

  it("round-trips through exportSync / loadSync", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([makeTx()]);
    s.addAddress("0-0", "addr-a");
    const dump = s.exportSync();

    const s2 = new BitcoinLikeStorage();
    s2.loadSync(dump);
    expect(s2.txsSize()).toBe(1);
    expect(s2.getTxs()[0].id).toBe("tx1");
  });

  it("removes txs matching a filter", () => {
    const s = new BitcoinLikeStorage();
    s.appendTxs([makeTx(), makeTx({ id: "tx2", account: 1, index: 0 })]);
    s.removeTxs({ account: 0, index: 0 });
    expect(s.getTxs().some(t => t.account === 0 && t.index === 0)).toBe(false);
    expect(s.getTxs().some(t => t.account === 1)).toBe(true);
  });
});
