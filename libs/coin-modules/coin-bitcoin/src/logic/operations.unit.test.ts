import { explorerTx, fakeExplorer } from "../test/fakeExplorer";
import { getBalance, listOperations, toAddressOperation, toTxDetails } from "./operations";
import type { BitcoinOperationDetails } from "./types";

const ME = "me";
const OTHER = "other";

describe("toAddressOperation", () => {
  it("reports what an address receives", () => {
    const tx = toTxDetails(
      explorerTx({
        id: "t1",
        inputs: [{ value: "1500", address: OTHER, output_hash: "p", output_index: 0, sequence: 0 }],
        outputs: [
          { value: "1000", address: ME, output_index: 0 },
          { value: "400", address: OTHER, output_index: 1 },
        ],
        fees: 100,
      }),
    );
    const op = toAddressOperation(tx, ME);
    expect(op).toMatchObject({ id: "t1-me", type: "IN", value: 1000n, senders: [OTHER] });
    expect(op.tx.feesPayer).toBeUndefined();
  });

  it("charges the fee to the address funding every input", () => {
    const tx = toTxDetails(
      explorerTx({
        id: "t2",
        inputs: [{ value: "2000", address: ME, output_hash: "p", output_index: 0, sequence: 0 }],
        outputs: [{ value: "1900", address: OTHER, output_index: 0 }],
        fees: 100,
      }),
    );
    const op = toAddressOperation(tx, ME);
    expect(op).toMatchObject({ type: "OUT", value: 1900n });
    expect(op.tx).toMatchObject({ fees: 100n, feesPayer: ME, failed: false });
  });

  it("does not charge the fee when other addresses fund the transaction too", () => {
    const tx = toTxDetails(
      explorerTx({
        id: "t3",
        inputs: [
          { value: "2000", address: ME, output_hash: "p", output_index: 0, sequence: 0 },
          { value: "2000", address: "mine-too", output_hash: "p", output_index: 1, sequence: 0 },
        ],
        outputs: [{ value: "3900", address: OTHER, output_index: 0 }],
        fees: 100,
      }),
    );
    const op = toAddressOperation(tx, ME);
    expect(op).toMatchObject({ type: "OUT", value: 2000n });
    expect(op.tx.feesPayer).toBeUndefined();
  });

  it("carries the whole transaction in the details, flagged pending without a block", () => {
    const tx = toTxDetails(
      explorerTx({
        id: "t4",
        block: null,
        outputs: [{ value: "10", address: ME, output_index: 0 }],
      }),
    );
    const op = toAddressOperation(tx, ME);
    const details = op.details as BitcoinOperationDetails;
    expect(details).toMatchObject({ version: 1, pending: true, tx: { id: "t4", block: null } });
    expect(op.tx.block.height).toBe(0);
  });
});

describe("listOperations", () => {
  const confirmed = explorerTx({
    id: "c1",
    outputs: [{ value: "5", address: ME, output_index: 0 }],
  });
  const alsoConfirmed = explorerTx({
    id: "c2",
    outputs: [{ value: "6", address: ME, output_index: 0 }],
  });
  const pending = explorerTx({
    id: "p1",
    block: null,
    outputs: [{ value: "7", address: ME, output_index: 0 }],
  });

  it("serves the mempool on the first page only, confirmed preferred", async () => {
    const explorer = fakeExplorer({
      pages: {
        [ME]: [
          { data: [confirmed], token: "page-1" },
          { data: [alsoConfirmed], token: null },
        ],
      },
      pending: { [ME]: [pending, { ...confirmed, block: null }] },
    });

    const first = await listOperations(explorer, ME, { minHeight: 0 });
    expect(first.items.map(op => op.tx.hash)).toEqual(["c1", "p1"]);
    expect(first.next).toBe("page-1");

    const second = await listOperations(explorer, ME, { minHeight: 0, cursor: "page-1" });
    expect(second.items.map(op => op.tx.hash)).toEqual(["c2"]);
    expect(second.next).toBeUndefined();
    expect(explorer.getAddressPendingTxs).toHaveBeenCalledTimes(1);
  });

  it("puts the mempool first in descending order", async () => {
    const explorer = fakeExplorer({
      pages: { [ME]: [{ data: [confirmed], token: null }] },
      pending: { [ME]: [pending] },
    });
    const page = await listOperations(explorer, ME, { minHeight: 0, order: "desc" });
    expect(page.items.map(op => op.tx.hash)).toEqual(["p1", "c1"]);
  });

  it("never returns a cursor that does not advance", async () => {
    const explorer = fakeExplorer({ pages: { [ME]: [{ data: [], token: "stuck-0" }] } });
    const page = await listOperations(explorer, ME, { minHeight: 0, cursor: "stuck-0" });
    expect(page.next).toBeUndefined();
  });

  it("passes the resume height to the explorer", async () => {
    const explorer = fakeExplorer();
    await listOperations(explorer, ME, { minHeight: 123, limit: 50 });
    expect(explorer.getAddressTxs).toHaveBeenCalledWith(ME, {
      fromHeight: 123,
      batchSize: 50,
      order: "ascending",
    });
  });
});

describe("getBalance", () => {
  it("sums the outputs of the address that nothing spends, mempool included", async () => {
    const explorer = fakeExplorer({
      pages: {
        [ME]: [
          {
            data: [
              explorerTx({
                id: "a",
                outputs: [
                  { value: "1000", address: ME, output_index: 0 },
                  { value: "2000", address: ME, output_index: 1 },
                ],
              }),
            ],
            token: "next-1",
          },
          {
            data: [
              explorerTx({
                id: "b",
                inputs: [
                  { value: "1000", address: ME, output_hash: "a", output_index: 0, sequence: 0 },
                ],
                outputs: [{ value: "900", address: OTHER, output_index: 0 }],
              }),
            ],
            token: null,
          },
        ],
      },
      pending: {
        [ME]: [
          explorerTx({
            id: "c",
            block: null,
            outputs: [{ value: "50", address: ME, output_index: 0 }],
          }),
        ],
      },
    });
    expect(await getBalance(explorer, ME)).toEqual([{ value: 2050n, asset: { type: "native" } }]);
  });
});
