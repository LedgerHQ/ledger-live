import BigNumber from "bignumber.js";
import { TrongridTxInfo } from "../types";
import {
  compareTxsByTimestamp,
  dropTxsAfterNextCursor,
  dropTxsBeforeCursor,
  parseCursor,
  serializeCursor,
} from "./cursor";

describe("cursor utilities", () => {
  describe("serializeCursor", () => {
    it("should serialize cursor correctly", () => {
      const cursor = { txHash: "abc123", timestamp: 1234567890 };
      expect(serializeCursor(cursor)).toBe("1234567890:abc123");
    });
  });

  describe("parseCursor", () => {
    it("should return null for undefined cursor", () => {
      expect(parseCursor(undefined)).toBeNull();
    });

    it("should parse valid cursor", () => {
      const result = parseCursor("1234567890:abc123");
      expect(result).toEqual({ txHash: "abc123", timestamp: 1234567890 });
    });

    it("should throw for cursor without separator", () => {
      expect(() => parseCursor("invalid")).toThrow("Invalid cursor format");
    });

    it("should throw for cursor with empty timestamp", () => {
      expect(() => parseCursor(":abc123")).toThrow("Invalid cursor format");
    });

    it("should throw for cursor with empty txHash", () => {
      expect(() => parseCursor("1234567890:")).toThrow("Invalid cursor format");
    });

    it("should throw for cursor with invalid timestamp", () => {
      expect(() => parseCursor("notanumber:abc123")).toThrow("Invalid cursor format");
    });
  });

  describe("compareTxsByTimestamp", () => {
    const makeTx = (txID: string, timestamp: number): TrongridTxInfo =>
      ({
        txID,
        date: new Date(timestamp),
        value: new BigNumber(0),
      }) as TrongridTxInfo;

    it("should sort ascending by timestamp", () => {
      const txs = [makeTx("b", 2000), makeTx("a", 1000), makeTx("c", 3000)];
      const sorted = [...txs].sort(compareTxsByTimestamp("asc"));
      expect(sorted.map(t => t.txID)).toEqual(["a", "b", "c"]);
    });

    it("should sort descending by timestamp", () => {
      const txs = [makeTx("b", 2000), makeTx("a", 1000), makeTx("c", 3000)];
      const sorted = [...txs].sort(compareTxsByTimestamp("desc"));
      expect(sorted.map(t => t.txID)).toEqual(["c", "b", "a"]);
    });
  });

  describe("dropTxsBeforeCursor", () => {
    const makeTx = (txID: string, timestamp: number): TrongridTxInfo =>
      ({
        txID,
        date: new Date(timestamp),
        value: new BigNumber(0),
      }) as TrongridTxInfo;

    it("should return all txs when cursor is null", () => {
      const txs = [makeTx("a", 1000), makeTx("b", 2000)];
      const result = dropTxsBeforeCursor({ txs, order: "asc", cursor: null });
      expect(result).toHaveLength(2);
    });

    it("should drop txs at and before cursor position when txHash found (asc)", () => {
      const txs = [makeTx("a", 1000), makeTx("b", 1000), makeTx("c", 1000), makeTx("d", 2000)];
      const result = dropTxsBeforeCursor({
        txs,
        order: "asc",
        cursor: { txHash: "b", timestamp: 1000 },
      });
      expect(result.map(t => t.txID)).toEqual(["c", "d"]);
    });

    it("should filter by timestamp when txHash not found (asc)", () => {
      const txs = [makeTx("a", 1000), makeTx("b", 2000), makeTx("c", 3000)];
      const result = dropTxsBeforeCursor({
        txs,
        order: "asc",
        cursor: { txHash: "notfound", timestamp: 1500 },
      });
      expect(result.map(t => t.txID)).toEqual(["b", "c"]);
    });

    it("should filter by timestamp when txHash not found (desc)", () => {
      const txs = [makeTx("c", 3000), makeTx("b", 2000), makeTx("a", 1000)];
      const result = dropTxsBeforeCursor({
        txs,
        order: "desc",
        cursor: { txHash: "notfound", timestamp: 2500 },
      });
      expect(result.map(t => t.txID)).toEqual(["b", "a"]);
    });
  });

  describe("dropTxsAfterNextCursor", () => {
    const makeTx = (txID: string, timestamp: number): TrongridTxInfo =>
      ({
        txID,
        date: new Date(timestamp),
        value: new BigNumber(0),
      }) as TrongridTxInfo;

    it("should use earliest boundary for asc order", () => {
      const nativeTxs = [makeTx("n1", 1000), makeTx("n2", 2000), makeTx("n3", 3000)];
      const trc20Txs = [makeTx("t1", 1500), makeTx("t2", 2500)];
      const pageTxs = [...nativeTxs, ...trc20Txs].sort(compareTxsByTimestamp("asc"));

      const result = dropTxsAfterNextCursor({
        order: "asc",
        cursor: undefined,
        pageTxs,
        nativeResult: { txs: nativeTxs, hasNextPage: true },
        trc20Result: { txs: trc20Txs, hasNextPage: true },
      });

      expect(result.txs.map(t => t.txID)).toEqual(["n1", "t1", "n2", "t2"]);
      expect(result.nextCursor).toContain("t2");
    });

    it("should use latest boundary for desc order", () => {
      const nativeTxs = [makeTx("n3", 3000), makeTx("n2", 2000), makeTx("n1", 1000)];
      const trc20Txs = [makeTx("t2", 2500), makeTx("t1", 1500)];
      const pageTxs = [...nativeTxs, ...trc20Txs].sort(compareTxsByTimestamp("desc"));

      const result = dropTxsAfterNextCursor({
        order: "desc",
        cursor: undefined,
        pageTxs,
        nativeResult: { txs: nativeTxs, hasNextPage: true },
        trc20Result: { txs: trc20Txs, hasNextPage: true },
      });

      expect(result.txs.map(t => t.txID)).toEqual(["n3", "t2", "n2", "t1"]);
      expect(result.nextCursor).toContain("t1");
    });

    it("should slice by boundary txID position when boundary is mid-block (asc)", () => {
      const nativeTxs = [makeTx("n1", 1000), makeTx("n2", 2000), makeTx("n3", 2000)];
      const trc20Txs = [makeTx("t1", 2000), makeTx("t2", 2000), makeTx("t3", 2000)];
      const pageTxs = [
        makeTx("n1", 1000),
        makeTx("n2", 2000),
        makeTx("t1", 2000),
        makeTx("n3", 2000),
        makeTx("t2", 2000),
        makeTx("t3", 2000),
      ];

      const result = dropTxsAfterNextCursor({
        order: "asc",
        cursor: undefined,
        pageTxs,
        nativeResult: { txs: nativeTxs, hasNextPage: true },
        trc20Result: { txs: trc20Txs, hasNextPage: true },
      });

      expect(result.nextCursor).toContain("n3");
      expect(result.txs.map(t => t.txID)).toEqual(["n1", "n2", "t1", "n3"]);
    });

    it("should slice by boundary txID position when boundary is mid-block (desc)", () => {
      const nativeTxs = [makeTx("n3", 2000), makeTx("n2", 2000), makeTx("n1", 1000)];
      const trc20Txs = [makeTx("t3", 2000), makeTx("t2", 2000), makeTx("t1", 2000)];
      const pageTxs = [
        makeTx("t3", 2000),
        makeTx("t2", 2000),
        makeTx("n3", 2000),
        makeTx("t1", 2000),
        makeTx("n2", 2000),
        makeTx("n1", 1000),
      ];

      const result = dropTxsAfterNextCursor({
        order: "desc",
        cursor: undefined,
        pageTxs,
        nativeResult: { txs: nativeTxs, hasNextPage: true },
        trc20Result: { txs: trc20Txs, hasNextPage: true },
      });

      expect(result.nextCursor).toContain("t1");
      expect(result.txs.map(t => t.txID)).toEqual(["t3", "t2", "n3", "t1"]);
    });

    it("should return all txs when no next page", () => {
      const nativeTxs = [makeTx("n1", 1000), makeTx("n2", 2000)];
      const trc20Txs = [makeTx("t1", 1500)];
      const pageTxs = [...nativeTxs, ...trc20Txs].sort(compareTxsByTimestamp("asc"));

      const result = dropTxsAfterNextCursor({
        order: "asc",
        cursor: undefined,
        pageTxs,
        nativeResult: { txs: nativeTxs, hasNextPage: false },
        trc20Result: { txs: trc20Txs, hasNextPage: false },
      });

      expect(result.txs.map(t => t.txID)).toEqual(["n1", "t1", "n2"]);
      expect(result.nextCursor).toBeUndefined();
    });
  });
});
