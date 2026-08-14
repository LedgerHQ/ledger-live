import { getMockedCoinFrameworkOperation } from "../__tests__/fixtures/operation.fixture";
import {
  assertCursorMatchesRequest,
  buildResumePoint,
  decodeOperationsCursor,
  dropThroughResumePoint,
  encodeOperationsCursor,
  resolveHeightWindow,
  type OperationsCursor,
} from "./listOperations.helpers";

const operationAt = (height: number, hash: string) =>
  getMockedCoinFrameworkOperation({
    id: hash,
    tx: {
      ...getMockedCoinFrameworkOperation().tx,
      hash,
      block: { hash, height, time: new Date() },
    },
  });

describe("listOperations.helpers", () => {
  describe("encode / decode", () => {
    it("round-trips a cursor that only pins the range", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "asc",
      };

      expect(decodeOperationsCursor(encodeOperationsCursor(cursor))).toEqual(cursor);
    });

    it("round-trips a cursor carrying a resume point", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "desc",
        resume: { block: 150, transactionId: "tx-b" },
      };

      expect(decodeOperationsCursor(encodeOperationsCursor(cursor))).toEqual(cursor);
    });

    it("returns null for an absent cursor", () => {
      expect(decodeOperationsCursor(undefined)).toBeNull();
    });

    it.each([
      ["not base64url at all", "!!!not-a-cursor!!!"],
      ["valid base64url that is not JSON", Buffer.from("nope").toString("base64url")],
      [
        "a negative height",
        encodeOperationsCursor({
          minHeight: -1,
          maxBlockHeight: 200,
          order: "asc",
        } as OperationsCursor),
      ],
      [
        "an unknown order",
        Buffer.from(
          JSON.stringify({ minHeight: 1, maxBlockHeight: 2, order: "sideways" }),
        ).toString("base64url"),
      ],
      [
        "a fractional resume block",
        Buffer.from(
          JSON.stringify({
            minHeight: 1,
            maxBlockHeight: 2,
            order: "asc",
            resume: { block: 1.5, transactionId: "tx-a" },
          }),
        ).toString("base64url"),
      ],
    ])("rejects %s", (_label, raw) => {
      expect(() => decodeOperationsCursor(raw)).toThrow(/malformed listOperations cursor/);
    });
  });

  describe("assertCursorMatchesRequest", () => {
    const cursor: OperationsCursor = {
      minHeight: 10,
      maxBlockHeight: 200,
      order: "asc",
    };

    it("accepts a cursor cut from the same window", () => {
      expect(() => assertCursorMatchesRequest(cursor, 10, "asc")).not.toThrow();
    });

    it("rejects a cursor replayed against a different minHeight", () => {
      expect(() => assertCursorMatchesRequest(cursor, 11, "asc")).toThrow(
        /does not match the requested range/,
      );
    });

    it("rejects a cursor whose order was flipped mid-run", () => {
      expect(() => assertCursorMatchesRequest(cursor, 10, "desc")).toThrow(
        /does not match the requested range/,
      );
    });
  });

  describe("resolveHeightWindow", () => {
    it("spans the whole range without a cursor", () => {
      expect(resolveHeightWindow(null, 10, 200)).toEqual({ from: 10, to: 200 });
    });

    it("spans the whole range for a cursor that only pins it", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "asc",
      };

      expect(resolveHeightWindow(cursor, 10, 200)).toEqual({
        from: 10,
        to: 200,
      });
    });

    it("raises the lower bound when resuming ascending", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "asc",
        resume: { block: 150, transactionId: "tx-b" },
      };

      expect(resolveHeightWindow(cursor, 10, 200)).toEqual({
        from: 150,
        to: 200,
      });
    });

    it("lowers the upper bound when resuming descending", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "desc",
        resume: { block: 150, transactionId: "tx-b" },
      };

      expect(resolveHeightWindow(cursor, 10, 200)).toEqual({
        from: 10,
        to: 150,
      });
    });
  });

  describe("buildResumePoint", () => {
    it("returns undefined when nothing was emitted", () => {
      expect(buildResumePoint([])).toBeUndefined();
    });

    it("names the last operation the page emitted", () => {
      const items = [operationAt(100, "a"), operationAt(101, "b")];

      expect(buildResumePoint(items)).toEqual({
        block: 101,
        transactionId: "b",
      });
    });

    it("distinguishes operations sharing a height", () => {
      const items = [operationAt(101, "b"), operationAt(101, "c")];

      expect(buildResumePoint(items)).toEqual({
        block: 101,
        transactionId: "c",
      });
    });
  });

  describe("dropThroughResumePoint", () => {
    // page 2 reopens on block 101, so the rows page 1 emitted there come back in this stream
    const ordered = [operationAt(101, "b"), operationAt(101, "c"), operationAt(102, "d")];

    it("keeps everything when there is no resume point", () => {
      expect(dropThroughResumePoint(ordered, undefined, "asc")).toEqual(ordered);
    });

    it("drops the operations already emitted at the boundary height", () => {
      const kept = dropThroughResumePoint(ordered, { block: 101, transactionId: "b" }, "asc");

      expect(kept.map(op => op.tx.hash)).toEqual(["c", "d"]);
    });

    it("drops a whole boundary height once its last operation went out", () => {
      const kept = dropThroughResumePoint(ordered, { block: 101, transactionId: "c" }, "asc");

      expect(kept.map(op => op.tx.hash)).toEqual(["d"]);
    });

    it("cuts at the right place descending", () => {
      const descending = [operationAt(102, "d"), operationAt(101, "c"), operationAt(101, "b")];
      const kept = dropThroughResumePoint(descending, { block: 101, transactionId: "c" }, "desc");

      expect(kept.map(op => op.tx.hash)).toEqual(["b"]);
    });

    it("still cuts when the resume point itself has left the range", () => {
      // a reorg dropped "c"; the position is an order key, not a lookup, so the cut still holds
      const withoutC = [operationAt(101, "b"), operationAt(102, "d")];
      const kept = dropThroughResumePoint(withoutC, { block: 101, transactionId: "c" }, "asc");

      expect(kept.map(op => op.tx.hash)).toEqual(["d"]);
    });
  });
});
