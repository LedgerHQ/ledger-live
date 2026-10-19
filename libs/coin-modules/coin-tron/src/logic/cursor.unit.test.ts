import BigNumber from "bignumber.js";
import { TrongridTxInfo } from "../types";
import {
  compareTxsByTimestamp,
  dropTxsAfterNextCursor,
  dropTxsBeforeCursor,
  isEmptyTronGridPage,
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

    describe("when the page was read further than its surviving transactions show", () => {
      it("resumes from the last record TronGrid returned when everything was filtered out", () => {
        const result = dropTxsAfterNextCursor({
          order: "desc",
          cursor: undefined,
          pageTxs: [],
          nativeResult: { txs: [], hasNextPage: true, lastRaw: makeTx("filtered", 3000) },
          trc20Result: { txs: [], hasNextPage: false },
        });

        expect(result.txs).toEqual([]);
        // timestamp-only position, one millisecond back (desc) so the next page starts again
        // from the whole boundary timestamp
        expect(result.nextCursor).toBe("3001:timestamp-only");
      });

      it("resumes from the raw record when the only native survivor was the cursor tx (desc)", () => {
        // The cursor tx was the only native survivor and has been dropped as "before cursor".
        const trc20Txs = [makeTx("t2", 1000), makeTx("t1", 500)];

        const result = dropTxsAfterNextCursor({
          order: "desc",
          cursor: "5000:cursorTx",
          pageTxs: trc20Txs,
          nativeResult: {
            txs: [makeTx("cursorTx", 5000)],
            hasNextPage: true,
            lastRaw: makeTx("filteredNative", 4000),
          },
          trc20Result: { txs: trc20Txs, hasNextPage: true },
        });

        expect(result.txs).toEqual([]);
        expect(result.nextCursor).toBe("4001:timestamp-only");
      });

      it("resumes from the raw record of an endpoint without survivors (asc)", () => {
        const trc20Txs = [makeTx("t1", 1000), makeTx("t2", 6000)];

        const result = dropTxsAfterNextCursor({
          order: "asc",
          cursor: undefined,
          pageTxs: trc20Txs,
          nativeResult: { txs: [], hasNextPage: true, lastRaw: makeTx("filteredNative", 2000) },
          trc20Result: { txs: trc20Txs, hasNextPage: true },
        });

        expect(result.txs.map(t => t.txID)).toEqual(["t1"]);
        expect(result.nextCursor).toBe("1999:timestamp-only");
      });

      it("keeps unseen txs that share the timestamp of an unkept boundary", () => {
        // `n3` shares the timestamp of the filtered boundary: it must not be emitted now, nor be
        // lost on the next page (which starts again from the whole boundary timestamp).
        const nativeTxs = [makeTx("n1", 1000), makeTx("n2", 1500)];

        const result = dropTxsAfterNextCursor({
          order: "asc",
          cursor: undefined,
          pageTxs: [...nativeTxs, makeTx("n3", 2000)],
          nativeResult: { txs: [], hasNextPage: true, lastRaw: makeTx("filtered", 2000) },
          trc20Result: { txs: [], hasNextPage: false },
        });

        expect(result.txs.map(t => t.txID)).toEqual(["n1", "n2"]);
        expect(result.nextCursor).toBe("1999:timestamp-only");
      });

      it("prefers a boundary that is in the page over a raw one with the same timestamp", () => {
        const trc20Txs = [makeTx("t1", 4000), makeTx("x", 3000)];

        const result = dropTxsAfterNextCursor({
          order: "desc",
          cursor: undefined,
          pageTxs: trc20Txs,
          nativeResult: { txs: [], hasNextPage: true, lastRaw: makeTx("filtered", 3000) },
          trc20Result: { txs: trc20Txs, hasNextPage: true },
        });

        expect(result.txs.map(t => t.txID)).toEqual(["t1", "x"]);
        expect(result.nextCursor).toBe(serializeCursor({ txHash: "x", timestamp: 3000 }));
      });

      it("ends pagination when resuming from the raw record would not move the cursor", () => {
        // 200 records at one timestamp fill a whole page: it cannot be crossed.
        const kept = [makeTx("a", 4000)];

        const result = dropTxsAfterNextCursor({
          order: "desc",
          cursor: "3001:timestamp-only",
          pageTxs: kept,
          nativeResult: { txs: [], hasNextPage: true, lastRaw: makeTx("filtered", 3000) },
          trc20Result: { txs: [], hasNextPage: false },
        });

        expect(result.nextCursor).toBeUndefined();
        expect(result.txs.map(t => t.txID)).toEqual(["a"]);
      });

      it("ignores an exhausted endpoint that has no surviving transaction", () => {
        const trc20Txs = [makeTx("t1", 3000), makeTx("t2", 2900)];

        const result = dropTxsAfterNextCursor({
          order: "desc",
          cursor: undefined,
          pageTxs: trc20Txs,
          nativeResult: { txs: [], hasNextPage: false, lastRaw: makeTx("filtered", 4000) },
          trc20Result: { txs: trc20Txs, hasNextPage: true },
        });

        expect(result.txs.map(t => t.txID)).toEqual(["t1", "t2"]);
        expect(result.nextCursor).toBe(serializeCursor({ txHash: "t2", timestamp: 2900 }));
      });
    });
  });

  describe("isEmptyTronGridPage", () => {
    const makeTx = (txID: string): TrongridTxInfo =>
      ({ txID, date: new Date(1000), value: new BigNumber(0) }) as TrongridTxInfo;

    it("is true when TronGrid returned nothing for both endpoints", () => {
      expect(
        isEmptyTronGridPage({ txs: [], hasNextPage: false }, { txs: [], hasNextPage: false }),
      ).toBe(true);
    });

    it("is false when records were returned but all filtered out", () => {
      expect(
        isEmptyTronGridPage(
          { txs: [], hasNextPage: true, lastRaw: makeTx("filtered") },
          { txs: [], hasNextPage: false },
        ),
      ).toBe(false);
    });

    it("is false when only surviving txs are given", () => {
      expect(
        isEmptyTronGridPage(
          { txs: [makeTx("n1")], hasNextPage: false },
          { txs: [], hasNextPage: false },
        ),
      ).toBe(false);
    });
  });
});
