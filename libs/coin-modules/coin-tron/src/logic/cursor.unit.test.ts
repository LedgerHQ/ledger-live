import type { TxEndpointPage } from "../network";
import { TrongridTxInfo } from "../types";
import {
  compareTxsByTimestamp,
  pageBoundary,
  parseCursor,
  serializeCursor,
  stepPast,
  walksBefore,
} from "./cursor";

const page = (timestamps: number[], next?: string): TxEndpointPage => ({
  timestamps,
  txs: [],
  next,
});

describe("cursor", () => {
  describe("serializeCursor / parseCursor", () => {
    it("round-trips a timestamp", () => {
      expect(parseCursor(serializeCursor(1717419792000))).toBe(1717419792000);
    });

    it("reads no cursor as null", () => {
      expect(parseCursor(undefined)).toBeNull();
      expect(parseCursor("")).toBeNull();
    });

    it.each(["invalid", "12:abc", "-5", "1.5", "99999999999999999999"])("rejects %s", cursor => {
      expect(() => parseCursor(cursor)).toThrow("Invalid cursor format");
    });
  });

  describe("walksBefore / stepPast", () => {
    it("walks forward in time in asc order", () => {
      expect(walksBefore("asc", 1, 2)).toBe(true);
      expect(walksBefore("asc", 2, 2)).toBe(false);
      expect(stepPast("asc", 2)).toBe(3);
    });

    it("walks backward in time in desc order", () => {
      expect(walksBefore("desc", 2, 1)).toBe(true);
      expect(walksBefore("desc", 2, 2)).toBe(false);
      expect(stepPast("desc", 2)).toBe(1);
    });
  });

  describe("compareTxsByTimestamp", () => {
    const txs = [3, 1, 2].map(ts => ({ txID: `tx${ts}`, date: new Date(ts) }) as TrongridTxInfo);

    it("sorts in walk order", () => {
      expect([...txs].sort(compareTxsByTimestamp("asc")).map(t => t.txID)).toEqual([
        "tx1",
        "tx2",
        "tx3",
      ]);
      expect([...txs].sort(compareTxsByTimestamp("desc")).map(t => t.txID)).toEqual([
        "tx3",
        "tx2",
        "tx1",
      ]);
    });
  });

  describe("pageBoundary", () => {
    it("is undefined when no endpoint has a next page", () => {
      expect(pageBoundary("desc", [page([9, 7]), page([8])])).toBeUndefined();
    });

    it("ignores an endpoint that has no next page", () => {
      expect(pageBoundary("desc", [page([9, 7, 5], "next"), page([8, 6])])).toBe(5);
    });

    it("takes the earliest open end in walk order", () => {
      expect(pageBoundary("desc", [page([9, 7, 5], "next"), page([8, 6], "next")])).toBe(6);
      expect(pageBoundary("asc", [page([1, 3, 5], "next"), page([2, 4], "next")])).toBe(4);
    });

    it("ignores an endpoint whose page is empty", () => {
      expect(pageBoundary("desc", [page([], "next"), page([8, 6], "next")])).toBe(6);
    });
  });
});
