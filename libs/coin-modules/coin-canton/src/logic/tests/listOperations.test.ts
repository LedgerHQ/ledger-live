import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { getLedgerEnd, getOperations, isGatewayEnabled } from "../../network/gateway";
import { createMockContext, createMockOperationView } from "../../test/fixtures";
import type { OperationView } from "../../types/gateway";
import { decodeDescendingCursor } from "../cursor";
import { listOperations } from "../listOperations";

jest.mock("../../network/gateway", () => ({
  getLedgerEnd: jest.fn(),
  getOperations: jest.fn(),
  isGatewayEnabled: jest.fn(() => true),
}));

const mockedGetLedgerEnd = jest.mocked(getLedgerEnd);
const mockedGetOperations = jest.mocked(getOperations);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);

const PARTY = "alice-party";
const context = createMockContext();

const row = (height: number, index = 0): OperationView =>
  createMockOperationView({
    uid: `uid-${height}-${index}`,
    block: { height, time: "2024-01-01T00:00:00.000Z", hash: `tx-${height}` },
  });

const rowsAt = (heights: number[], rowsPerOffset = 1): OperationView[] =>
  heights.flatMap(height => Array.from({ length: rowsPerOffset }, (_, i) => row(height, i)));

const range = (from: number, count: number, step = 1) =>
  Array.from({ length: count }, (_, i) => from + i * step);

type Ledger = {
  rows: OperationView[];
  ledgerEnd: number;
  offsetsWithoutRows?: number[];
  nextIsFirstUnserved?: boolean;
};

function fakeGateway({
  rows,
  ledgerEnd,
  offsetsWithoutRows = [],
  nextIsFirstUnserved = false,
}: Ledger): void {
  const offsets = [...new Set([...rows.map(r => r.block.height), ...offsetsWithoutRows])].sort(
    (a, b) => a - b,
  );
  mockedGetLedgerEnd.mockResolvedValue(ledgerEnd);
  mockedGetOperations.mockImplementation(async (_config, _partyId, options = {}) => {
    const start = options.cursor ?? options.minOffset ?? 0;
    const end = Math.min(options.maxOffset ?? ledgerEnd, ledgerEnd);
    if (start > end) throw new Error("INVALID_OFFSET_RANGE");
    const inRange = offsets.filter(o => o >= start && o <= end);
    const served = inRange.slice(0, options.limit ?? 100);
    const firstUnserved = inRange[served.length];
    return {
      operations: rows.filter(r => served.includes(r.block.height)),
      next: firstUnserved === undefined ? -1 : firstUnserved + (nextIsFirstUnserved ? 0 : 1),
    };
  });
}

async function walk(options: Omit<ListOperationsOptions, "cursor">): Promise<Page<Operation>[]> {
  const pages: Page<Operation>[] = [];
  let cursor: string | undefined;
  do {
    const page = await listOperations(context, PARTY, { ...options, cursor });
    pages.push(page);
    cursor = page.next;
  } while (cursor && pages.length < 500);
  return pages;
}

const ids = (pages: Page<Operation>[]) => pages.flatMap(page => page.items.map(op => op.id));
const oldestFirstIds = (rows: OperationView[]) => rows.map(r => r.uid);
const newestFirstIds = (rows: OperationView[]) => oldestFirstIds(rows).reverse();

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsGatewayEnabled.mockReturnValue(true);
  });

  describe("options", () => {
    it.each([-1, 1.5, Number.NaN])("rejects minHeight %p", async minHeight => {
      await expect(listOperations(context, PARTY, { minHeight })).rejects.toThrow(
        InvalidParameterError,
      );
      expect(mockedGetOperations).not.toHaveBeenCalled();
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects limit %p", async limit => {
      await expect(listOperations(context, PARTY, { minHeight: 0, limit })).rejects.toThrow(
        InvalidParameterError,
      );
      expect(mockedGetOperations).not.toHaveBeenCalled();
    });

    it.each(["abc", "10", "10:0", "10:x", "99999999999999999999:10"])(
      "rejects the newest-first cursor %p",
      async cursor => {
        await expect(
          listOperations(context, PARTY, { minHeight: 0, order: "desc", cursor }),
        ).rejects.toThrow(InvalidParameterError);
      },
    );

    it.each(["abc", "1:2", "-1", "99999999999999999999"])(
      "rejects the oldest-first cursor %p",
      async cursor => {
        await expect(listOperations(context, PARTY, { minHeight: 0, cursor })).rejects.toThrow(
          InvalidParameterError,
        );
      },
    );

    it("throws when the gateway is disabled, the only implemented transport", async () => {
      mockedIsGatewayEnabled.mockReturnValue(false);

      await expect(listOperations(context, PARTY, { minHeight: 0 })).rejects.toThrow(
        "Not implemented",
      );
      expect(mockedGetOperations).not.toHaveBeenCalled();
    });
  });

  describe("oldest first", () => {
    it("starts at the cursor, forwards the limit, and resumes after the last row served", async () => {
      mockedGetLedgerEnd.mockResolvedValue(100);
      mockedGetOperations.mockResolvedValue({ next: 25, operations: [row(12)] });

      const page = await listOperations(context, PARTY, { minHeight: 3, cursor: "10", limit: 20 });

      expect(mockedGetOperations).toHaveBeenCalledWith(expect.anything(), PARTY, {
        minOffset: 10,
        limit: 20,
      });
      expect(page.items.map(op => op.id)).toEqual(["uid-12-0"]);
      expect(page.next).toBe("13");
    });

    it("never starts below minHeight, whatever the cursor", async () => {
      mockedGetLedgerEnd.mockResolvedValue(100);
      mockedGetOperations.mockResolvedValue({ next: -1, operations: [] });

      await listOperations(context, PARTY, { minHeight: 10, cursor: "5" });

      expect(mockedGetOperations).toHaveBeenCalledWith(expect.anything(), PARTY, {
        minOffset: 10,
        limit: undefined,
      });
    });

    it("answers an empty page when the cursor is past the ledger end", async () => {
      mockedGetLedgerEnd.mockResolvedValue(10);

      await expect(listOperations(context, PARTY, { minHeight: 0, cursor: "11" })).resolves.toEqual(
        { items: [], next: undefined },
      );
      expect(mockedGetOperations).not.toHaveBeenCalled();
    });

    it("resumes at the gateway's first unserved transaction after a page without rows", async () => {
      mockedGetLedgerEnd.mockResolvedValue(100);
      mockedGetOperations.mockResolvedValue({ next: 25, operations: [] });

      const page = await listOperations(context, PARTY, { minHeight: 3, cursor: "10" });

      expect(page.next).toBe("24");
    });

    it("rejects a gateway cursor that does not advance", async () => {
      mockedGetLedgerEnd.mockResolvedValue(100);
      mockedGetOperations.mockResolvedValue({ next: 10, operations: [] });

      await expect(listOperations(context, PARTY, { minHeight: 0, cursor: "10" })).rejects.toThrow(
        "does not advance",
      );
    });

    it("ends the stream when the gateway answers next = -1", async () => {
      fakeGateway({ rows: rowsAt([5, 6]), ledgerEnd: 100 });

      const page = await listOperations(context, PARTY, { minHeight: 0 });

      expect(page.next).toBeUndefined();
    });

    it("answers an empty page when the start offset is past the ledger end", async () => {
      fakeGateway({ rows: [], ledgerEnd: 100 });

      await expect(listOperations(context, PARTY, { minHeight: 101 })).resolves.toEqual({
        items: [],
        next: undefined,
      });
      expect(mockedGetOperations).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ["the deployed gateway's next", false],
    ["a corrected next", true],
  ])("walking with %s", (_label, nextIsFirstUnserved) => {
    it("returns every row once, oldest first", async () => {
      const rows = rowsAt(range(500, 250));
      fakeGateway({ rows, ledgerEnd: 2_000, nextIsFirstUnserved });

      const pages = await walk({ minHeight: 0, limit: 40 });

      expect(ids(pages)).toEqual(oldestFirstIds(rows));
    });

    it("returns every row once, oldest first, across pages without rows", async () => {
      const rows = rowsAt(range(1_000, 40, 31));
      fakeGateway({
        rows,
        ledgerEnd: 6_000,
        offsetsWithoutRows: range(1_000, 1_300),
        nextIsFirstUnserved,
      });

      const pages = await walk({ minHeight: 0, limit: 30 });
      const resumePoints = pages.flatMap(page => (page.next ? [Number(page.next)] : []));

      expect(ids(pages)).toEqual(oldestFirstIds(rows));
      expect(pages.some(page => page.items.length === 0 && page.next)).toBe(true);
      expect(resumePoints).toEqual([...new Set(resumePoints)].sort((a, b) => a - b));
      expect(pages.at(-1)?.next).toBeUndefined();
    });

    it("returns every row once, newest first, across a sparse history", async () => {
      const rows = rowsAt(range(7, 30, 33_331));
      fakeGateway({ rows, ledgerEnd: 1_000_000, nextIsFirstUnserved });

      const pages = await walk({ minHeight: 0, order: "desc" });

      expect(ids(pages)).toEqual(newestFirstIds(rows));
    });

    it("keeps every row when most transactions have none for the party", async () => {
      const rows = rowsAt(range(1_003, 40, 97));
      fakeGateway({
        rows,
        ledgerEnd: 6_000,
        offsetsWithoutRows: range(1_000, 4_000),
        nextIsFirstUnserved,
      });

      const pages = await walk({ minHeight: 0, order: "desc" });

      expect(ids(pages)).toEqual(newestFirstIds(rows));
    });

    it("keeps pages within the limit across a dense history", async () => {
      const rows = rowsAt(range(500, 250));
      fakeGateway({ rows, ledgerEnd: 2_000, nextIsFirstUnserved });

      const pages = await walk({ minHeight: 0, order: "desc", limit: 40 });

      expect(ids(pages)).toEqual(newestFirstIds(rows));
      expect(Math.max(...pages.map(page => page.items.length))).toBeLessThanOrEqual(40);
    });

    it("never splits the rows of one transaction across pages", async () => {
      const rows = rowsAt([100, 200, 300, 400], 3);
      fakeGateway({ rows, ledgerEnd: 1_000, nextIsFirstUnserved });

      const pages = await walk({ minHeight: 0, order: "desc", limit: 2 });

      expect(ids(pages)).toEqual(newestFirstIds(rows));
      for (const page of pages) {
        const heights = new Set(page.items.map(op => op.tx.block.height));
        expect(page.items).toHaveLength(heights.size * 3);
      }
    });

    it("overshoots the limit rather than stall on a transaction larger than it", async () => {
      const rows = rowsAt([50], 5);
      fakeGateway({ rows, ledgerEnd: 100, nextIsFirstUnserved });

      const pages = await walk({ minHeight: 0, order: "desc", limit: 2 });

      expect(ids(pages)).toEqual(newestFirstIds(rows));
    });

    it("emits strictly decreasing cursors with integral windows", async () => {
      const rows = rowsAt(range(20_000, 400));
      fakeGateway({ rows, ledgerEnd: 30_000, nextIsFirstUnserved });

      const pages = await walk({ minHeight: 0, order: "desc", limit: 7 });
      const cursors = pages.flatMap(page => (page.next ? [decodeDescendingCursor(page.next)] : []));

      const highestOffsets = cursors.map(cursor => cursor.highestOffset);

      expect(ids(pages)).toEqual(newestFirstIds(rows));
      expect(highestOffsets).toEqual([...new Set(highestOffsets)].sort((a, b) => b - a));
      expect(cursors.every(cursor => Number.isInteger(cursor.windowWidth))).toBe(true);
      for (const [, , options] of mockedGetOperations.mock.calls) {
        expect(Number.isInteger(options?.minOffset)).toBe(true);
        expect(options?.minOffset).toBeLessThanOrEqual(options?.maxOffset ?? Infinity);
      }
    });
  });

  describe("newest first", () => {
    it("stops at minHeight", async () => {
      fakeGateway({ rows: rowsAt([10, 20, 30, 40]), ledgerEnd: 100 });

      const pages = await walk({ minHeight: 25, order: "desc" });

      expect(ids(pages)).toEqual(["uid-40-0", "uid-30-0"]);
    });

    it("answers an empty page, without a query, when minHeight is above the ledger end", async () => {
      fakeGateway({ rows: [], ledgerEnd: 100 });

      await expect(
        listOperations(context, PARTY, { minHeight: 101, order: "desc" }),
      ).resolves.toEqual({ items: [], next: undefined });
      expect(mockedGetOperations).not.toHaveBeenCalled();
    });

    it("walks an empty history in few pages", async () => {
      fakeGateway({ rows: [], ledgerEnd: 10_307_199 });

      const pages = await walk({ minHeight: 0, order: "desc" });

      expect(ids(pages)).toEqual([]);
      expect(pages.length).toBeLessThan(15);
    });

    it("reads the transaction at the window's top offset when the gateway's next points past it", async () => {
      mockedGetLedgerEnd.mockResolvedValue(100);
      mockedGetOperations
        .mockResolvedValueOnce({ next: 101, operations: [row(99)] })
        .mockResolvedValueOnce({ next: -1, operations: [row(100)] });

      const page = await listOperations(context, PARTY, { minHeight: 95, order: "desc" });

      expect(mockedGetOperations).toHaveBeenLastCalledWith(
        expect.anything(),
        PARTY,
        expect.objectContaining({ cursor: 100 }),
      );
      expect(page.items.map(op => op.id)).toEqual(["uid-100-0", "uid-99-0"]);
    });

    it("rejects a gateway cursor that does not advance inside a window", async () => {
      mockedGetLedgerEnd.mockResolvedValue(100);
      mockedGetOperations.mockResolvedValueOnce({ next: 0, operations: [] });

      await expect(listOperations(context, PARTY, { minHeight: 0, order: "desc" })).rejects.toThrow(
        "does not advance",
      );
    });
  });
});
