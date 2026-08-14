import { getMockedCoinFrameworkOperation } from "../__tests__/fixtures/operation.fixture";
import {
  assertCursorMatchesRequest,
  decodeOperationsCursor,
  encodeOperationsCursor,
  resolveBlockWindow,
  sortOperations,
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

    it("round-trips a cursor carrying a resume block", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "desc",
        nextBlock: 150,
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
          JSON.stringify({ minHeight: 1, maxBlockHeight: 2, order: "asc", nextBlock: 1.5 }),
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

  describe("resolveBlockWindow", () => {
    it("spans the whole range without a cursor", () => {
      expect(resolveBlockWindow(null, 10, 200)).toEqual({ fromBlock: 10, toBlock: 200 });
    });

    it("spans the whole range for a cursor that only pins it", () => {
      const cursor: OperationsCursor = { minHeight: 10, maxBlockHeight: 200, order: "asc" };

      expect(resolveBlockWindow(cursor, 10, 200)).toEqual({ fromBlock: 10, toBlock: 200 });
    });

    it("raises the lower bound to the resume block when ascending", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "asc",
        nextBlock: 150,
      };

      expect(resolveBlockWindow(cursor, 10, 200)).toEqual({ fromBlock: 150, toBlock: 200 });
    });

    it("lowers the upper bound to the resume block when descending", () => {
      const cursor: OperationsCursor = {
        minHeight: 10,
        maxBlockHeight: 200,
        order: "desc",
        nextBlock: 150,
      };

      expect(resolveBlockWindow(cursor, 10, 200)).toEqual({ fromBlock: 10, toBlock: 150 });
    });

    it("returns null when the ceiling sits below minHeight", () => {
      expect(resolveBlockWindow(null, 200, 10)).toBeNull();
    });

    it("returns null when a pinned range is inverted", () => {
      const cursor: OperationsCursor = {
        minHeight: 200,
        maxBlockHeight: 200,
        order: "desc",
        nextBlock: 10,
      };

      expect(resolveBlockWindow(cursor, 200, 200)).toBeNull();
    });
  });

  describe("sortOperations", () => {
    it("orders by block height ascending", () => {
      const sorted = sortOperations([operationAt(102, "d"), operationAt(100, "a")], "asc");

      expect(sorted.map(op => op.tx.hash)).toEqual(["a", "d"]);
    });

    it("orders by block height descending", () => {
      const sorted = sortOperations([operationAt(100, "a"), operationAt(102, "d")], "desc");

      expect(sorted.map(op => op.tx.hash)).toEqual(["d", "a"]);
    });

    it("breaks ties on hash so operations at one height keep a stable order", () => {
      const sorted = sortOperations([operationAt(101, "c"), operationAt(101, "b")], "asc");

      expect(sorted.map(op => op.tx.hash)).toEqual(["b", "c"]);
    });
  });
});
