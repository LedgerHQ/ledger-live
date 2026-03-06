import type { BlockTransaction } from "@ledgerhq/coin-framework/api/index";
import { internalTxsToOperationsByHash } from "../adapters/etherscan";
import { mergeInternalTransactions } from "./internalTransactionsByBlock";

const baseInternalTx = {
  blockNumber: "100",
  timeStamp: "1635100060",
  hash: "0xtx1",
  from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
  to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  value: "1000000000000000000",
  contractAddress: "",
  input: "",
  type: "call",
  gas: "21000",
  gasUsed: "21000",
  traceId: "0",
  isError: "0",
  errCode: "",
};

const makeBlockTx = (
  hash: string,
  operations: BlockTransaction["operations"] = [],
): BlockTransaction => ({
  hash,
  failed: false,
  operations,
  fees: 0n,
  feesPayer: "0xfrom",
});

describe("internalTransactionsByBlock", () => {
  describe("internalTxsToOperationsByHash", () => {
    it("groups internal txs by hash and converts to native transfer operations", () => {
      const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", value: "1000000000000000000" }];
      const byHash = internalTxsToOperationsByHash(internalTxs);
      expect(byHash.size).toBe(1);
      const ops = byHash.get("0xtx1")!;
      expect(ops).toHaveLength(2); // sender + receiver
      expect(ops.map(o => o.amount).sort()).toEqual([-1000000000000000000n, 1000000000000000000n]);
      expect(ops.every(o => o.type === "transfer" && o.asset.type === "native")).toBe(true);
    });

    it("skips internal txs with isError === '1'", () => {
      const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", isError: "1", value: "1000" }];
      const byHash = internalTxsToOperationsByHash(internalTxs);
      expect(byHash.size).toBe(0);
    });

    it("skips internal txs with value === '0'", () => {
      const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", value: "0" }];
      const byHash = internalTxsToOperationsByHash(internalTxs);
      expect(byHash.size).toBe(0);
    });

    it("returns empty map for empty internal txs array", () => {
      const byHash = internalTxsToOperationsByHash([]);
      expect(byHash.size).toBe(0);
    });

    it("accumulates multiple internal txs for the same tx hash", () => {
      const internalTxs = [
        { ...baseInternalTx, hash: "0xtx1", value: "1000", from: "0xa", to: "0xb" },
        { ...baseInternalTx, hash: "0xtx1", value: "2000", from: "0xc", to: "0xd" },
      ];
      const byHash = internalTxsToOperationsByHash(internalTxs);
      expect(byHash.size).toBe(1);
      expect(byHash.get("0xtx1")!.length).toBe(4); // 2 internal txs × 2 ops each
    });
  });

  describe("mergeInternalTransactions", () => {
    it("merges internal tx operations into matching BlockTransactions by hash", () => {
      const transactions: BlockTransaction[] = [makeBlockTx("0xtx1", []), makeBlockTx("0xtx2", [])];
      const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", value: "500" }];
      const merged = mergeInternalTransactions(transactions, internalTxs);
      expect(merged[0].operations).toHaveLength(2);
      expect(merged[1].operations).toHaveLength(0);
    });

    it("leaves transactions unchanged when no matching internal txs exist", () => {
      const transactions: BlockTransaction[] = [
        makeBlockTx("0xtx1", [
          { type: "transfer", address: "0xa", asset: { type: "native" }, amount: -1n },
        ]),
      ];
      const internalTxs = [{ ...baseInternalTx, hash: "0xtxOther", value: "1000" }];
      const merged = mergeInternalTransactions(transactions, internalTxs);
      expect(merged[0].operations).toHaveLength(1);
    });

    it("handles empty internal txs array (no-op)", () => {
      const transactions: BlockTransaction[] = [makeBlockTx("0xtx1", [])];
      const merged = mergeInternalTransactions(transactions, []);
      expect(merged).toBe(transactions);
      expect(merged[0].operations).toHaveLength(0);
    });

    it("handles internal txs that all get filtered out (isError/value)", () => {
      const transactions: BlockTransaction[] = [makeBlockTx("0xtx1", [])];
      const internalTxs = [
        { ...baseInternalTx, hash: "0xtx1", isError: "1", value: "1000" },
        { ...baseInternalTx, hash: "0xtx1", value: "0" },
      ];
      const merged = mergeInternalTransactions(transactions, internalTxs);
      expect(merged[0].operations).toHaveLength(0);
    });

    it("appends internal operations to existing transaction operations", () => {
      const existingOp = {
        type: "transfer" as const,
        address: "0xa",
        asset: { type: "native" as const },
        amount: -100n,
      };
      const transactions: BlockTransaction[] = [makeBlockTx("0xtx1", [existingOp])];
      const internalTxs = [{ ...baseInternalTx, hash: "0xtx1", value: "500" }];
      const merged = mergeInternalTransactions(transactions, internalTxs);
      expect(merged[0].operations).toHaveLength(3); // 1 existing + 2 from internal
      expect(merged[0].operations[0]).toEqual(existingOp);
    });
  });
});
