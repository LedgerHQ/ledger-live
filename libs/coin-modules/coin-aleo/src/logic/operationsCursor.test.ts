import { getMockedCoinFrameworkOperation } from "../__tests__/fixtures/operation.fixture";
import {
  assertCursorMatchesRequest,
  buildResumePoint,
  decodeOperationsCursor,
  encodeOperationsCursor,
  resolveHeightWindow,
  type OperationsCursor,
} from "./operationsCursor";

const operationAt = (height: number, hash: string) =>
  getMockedCoinFrameworkOperation({
    id: hash,
    tx: {
      ...getMockedCoinFrameworkOperation().tx,
      hash,
      block: { hash, height, time: new Date() },
    },
  });

describe("operationsCursor", () => {
  describe("encode / decode", () => {
    it("round-trips a cursor that only pins the range", () => {
      const cursor: OperationsCursor = { minHeight: 10, maxBlockHeight: 200, order: "asc" };

      expect(decodeOperationsCursor(encodeOperationsCursor(cursor))).toEqual(cursor);
    });

    it("round-trips a cursor carrying a resume point", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "desc",
        resume: { height: 150, emitted: 3 },
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
        "a fractional resume height",
        Buffer.from(
          JSON.stringify({
            minHeight: 1,
            maxBlockHeight: 2,
            order: "asc",
            resume: { height: 1.5, emitted: 1 },
          }),
        ).toString("base64url"),
      ],
    ])("rejects %s", (_label, raw) => {
      expect(() => decodeOperationsCursor(raw)).toThrow(/malformed listOperations cursor/);
    });
  });

  describe("assertCursorMatchesRequest", () => {
    const cursor: OperationsCursor = { minHeight: 10, maxBlockHeight: 200, order: "asc" };

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
      const cursor: OperationsCursor = { minHeight: 10, maxBlockHeight: 200, order: "asc" };

      expect(resolveHeightWindow(cursor, 10, 200)).toEqual({ from: 10, to: 200 });
    });

    it("raises the lower bound when resuming ascending", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "asc",
        resume: { height: 150, emitted: 2 },
      };

      expect(resolveHeightWindow(cursor, 10, 200)).toEqual({ from: 150, to: 200 });
    });

    it("lowers the upper bound when resuming descending", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "desc",
        resume: { height: 150, emitted: 2 },
      };

      expect(resolveHeightWindow(cursor, 10, 200)).toEqual({ from: 10, to: 150 });
    });
  });

  describe("buildResumePoint", () => {
    it("returns undefined when nothing was emitted", () => {
      expect(buildResumePoint([], 0, 0)).toBeUndefined();
    });

    it("counts a single operation at the boundary height", () => {
      const ordered = [operationAt(100, "a"), operationAt(101, "b")];

      expect(buildResumePoint(ordered, 0, 2)).toEqual({ height: 101, emitted: 1 });
    });

    it("counts every operation sharing the boundary height", () => {
      const ordered = [operationAt(100, "a"), operationAt(101, "b"), operationAt(101, "c")];

      expect(buildResumePoint(ordered, 0, 3)).toEqual({ height: 101, emitted: 2 });
    });

    it("accumulates the boundary count across pages", () => {
      // page 2 re-reads from height 101, so the two rows page 1 emitted there are in this stream too
      const ordered = [operationAt(101, "b"), operationAt(101, "c"), operationAt(101, "d")];

      expect(buildResumePoint(ordered, 2, 1)).toEqual({ height: 101, emitted: 3 });
    });

    it("resets the count once the boundary height moves on", () => {
      const ordered = [operationAt(101, "b"), operationAt(101, "c"), operationAt(102, "d")];

      expect(buildResumePoint(ordered, 2, 1)).toEqual({ height: 102, emitted: 1 });
    });
  });
});
