import { mapTxToOperations } from "../listOperations";
import type { TX } from "@ledgerhq/wallet-btc/storage/types";

// Unit tests for the pure IN/OUT/change/self-send mapping (pagination is covered by the integ test).

type Addr = { account: number; index: number; address: string };

const sets = (addresses: Addr[]) => ({
  accountAddresses: new Set(addresses.map(a => a.address)),
  changeAddresses: new Set(addresses.filter(a => a.account === 1).map(a => a.address)),
});

const map = (tx: unknown, addresses: Addr[]) => {
  const { accountAddresses, changeAddresses } = sets(addresses);
  return mapTxToOperations(tx as unknown as TX, accountAddresses, changeAddresses);
};

const inTx = (hash: string, height: number, address: string): Record<string, unknown> => ({
  id: hash,
  hash,
  received_at: "2024-01-01T00:00:00Z",
  block: { height, hash: `b${height}`, time: "2024-01-01T00:00:00Z" },
  inputs: [
    { value: "500000", address: "external", output_hash: "p", output_index: 0, sequence: 0 },
  ],
  outputs: [{ value: "40000", address, output_hash: hash, output_index: 0, rbf: false }],
  fees: 1000,
});

describe("logic/listOperations — mapTxToOperations", () => {
  it("maps an incoming tx to an IN operation crediting an account address", () => {
    const addresses = [{ account: 0, index: 0, address: "addrA" }];
    const ops = map(inTx("tx1", 100, "addrA"), addresses);
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("IN");
    expect(ops[0].value).toBe(40000n);
    expect(ops[0].recipients).toEqual(["addrA"]);
    expect(ops[0].id).toBe("tx1-IN");
  });

  it("maps a spending tx to an OUT operation with fee-excluded value = amount to destination", () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 1, index: 0, address: "changeA" },
    ];
    const tx = {
      id: "tx2",
      hash: "tx2",
      received_at: "2024-02-01T00:00:00Z",
      block: { height: 200, hash: "b200", time: "2024-02-01T00:00:00Z" },
      inputs: [
        { value: "100000", address: "addrA", output_hash: "p", output_index: 0, sequence: 0 },
      ],
      outputs: [
        { value: "70000", address: "dest", output_hash: "tx2", output_index: 0, rbf: false },
        { value: "29000", address: "changeA", output_hash: "tx2", output_index: 1, rbf: false },
      ],
      fees: 1000,
    };
    const ops = map(tx, addresses);
    expect(ops[0].type).toBe("OUT");
    expect(ops[0].value).toBe(70000n); // fee-excluded; change excluded
    expect(ops[0].recipients).toEqual(["dest"]);
  });

  it("emits both an OUT and an IN for a self-send to the account's own (non-change) address", () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 0, index: 1, address: "addrB" },
      { account: 1, index: 0, address: "changeA" },
    ];
    const tx = {
      id: "txSelf",
      hash: "txSelf",
      received_at: "2024-04-01T00:00:00Z",
      block: { height: 400, hash: "b400", time: "2024-04-01T00:00:00Z" },
      inputs: [
        { value: "100000", address: "addrA", output_hash: "p", output_index: 0, sequence: 0 },
      ],
      outputs: [
        { value: "90000", address: "addrB", output_hash: "txSelf", output_index: 0, rbf: false },
        { value: "9000", address: "changeA", output_hash: "txSelf", output_index: 1, rbf: false },
      ],
      fees: 1000,
    };
    const byId = Object.fromEntries(map(tx, addresses).map(op => [op.id, op]));
    expect(byId["txSelf-OUT"].value).toBe(90000n);
    expect(byId["txSelf-OUT"].recipients).toEqual(["addrB"]);
    expect(byId["txSelf-IN"].value).toBe(90000n);
    expect(byId["txSelf-IN"].recipients).toEqual(["addrB"]);
  });

  it("does not emit a spurious IN for an ordinary send's change output", () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 1, index: 0, address: "changeA" },
    ];
    const tx = {
      id: "txSend",
      hash: "txSend",
      received_at: "2024-05-01T00:00:00Z",
      block: { height: 500, hash: "b500", time: "2024-05-01T00:00:00Z" },
      inputs: [
        { value: "100000", address: "addrA", output_hash: "p", output_index: 0, sequence: 0 },
      ],
      outputs: [
        { value: "70000", address: "dest", output_hash: "txSend", output_index: 0, rbf: false },
        { value: "29000", address: "changeA", output_hash: "txSend", output_index: 1, rbf: false },
      ],
      fees: 1000,
    };
    const ops = map(tx, addresses);
    expect(ops).toHaveLength(1);
    expect(ops[0].id).toBe("txSend-OUT");
    expect(ops[0].value).toBe(70000n);
  });

  it("credits the change address as recipient for a pure receive landing on the change chain", () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 1, index: 0, address: "changeA" },
    ];
    const tx = {
      id: "txRcv",
      hash: "txRcv",
      received_at: "2024-06-01T00:00:00Z",
      block: { height: 600, hash: "b600", time: "2024-06-01T00:00:00Z" },
      inputs: [
        { value: "500000", address: "external", output_hash: "p", output_index: 0, sequence: 0 },
      ],
      outputs: [
        { value: "45000", address: "changeA", output_hash: "txRcv", output_index: 0, rbf: false },
      ],
      fees: 1000,
    };
    const ops = map(tx, addresses);
    expect(ops).toHaveLength(1);
    expect(ops[0].id).toBe("txRcv-IN");
    expect(ops[0].value).toBe(45000n);
    expect(ops[0].recipients).toEqual(["changeA"]);
  });

  it("emits an OUT for a pending spend whose account input has no prevout value", () => {
    const addresses = [{ account: 0, index: 0, address: "addrA" }];
    const tx = {
      id: "txPending",
      hash: "txPending",
      received_at: "2024-07-01T00:00:00Z",
      block: null,
      inputs: [{ address: "addrA", output_hash: "p", output_index: 0, sequence: 0 }],
      outputs: [
        { value: "70000", address: "dest", output_hash: "txPending", output_index: 0, rbf: false },
      ],
      fees: 1000,
    };
    const ops = map(tx, addresses);
    expect(ops).toHaveLength(1);
    expect(ops[0].id).toBe("txPending-OUT");
    expect(ops[0].type).toBe("OUT");
    expect(ops[0].value).toBe(70000n);
    expect(ops[0].tx.block.height).toBe(0); // pending → height 0
  });

  it("aggregates account-wide: two txs on two derived addresses each yield an IN", () => {
    const addresses = [
      { account: 0, index: 0, address: "addrA" },
      { account: 0, index: 1, address: "addrB" },
    ];
    const ops = [inTx("txA", 100, "addrA"), inTx("txB", 200, "addrB")].flatMap(tx =>
      map(tx, addresses),
    );
    expect(ops).toHaveLength(2);
    expect(ops.every(op => op.type === "IN")).toBe(true);
    expect(new Set(ops.flatMap(op => op.recipients))).toEqual(new Set(["addrA", "addrB"]));
  });
});
