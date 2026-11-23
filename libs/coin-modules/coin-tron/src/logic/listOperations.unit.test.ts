import type { Logger } from "@ledgerhq/coin-module-framework/config";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import {
  fetchTronAccountTxsEndpointPage,
  fetchTronAccountTxsPage,
  FetchTxsPageParams,
  getBlock,
  TxEndpoint,
  TxEndpointPage,
} from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TrongridTxInfo } from "../types";
import { TronEmptyPage, TronPageServedTwice } from "../types/errors";
import { listOperations, ListOperationsOptions } from "./listOperations";

jest.mock("../network", () => ({
  fetchTronAccountTxsPage: jest.fn(),
  fetchTronAccountTxsEndpointPage: jest.fn(),
  getBlock: jest.fn(),
}));

jest.mock("../network/trongrid/trongrid-adapters", () => ({
  ...jest.requireActual("../network/trongrid/trongrid-adapters"),
  fromTrongridTxInfoToOperation: jest.fn(),
}));

const TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const address = "tronExampleAddress";
const config = {} as TronCoinConfig;
const logger: Logger = (..._args: unknown[]) => {};

type FakeRecord = { id: string; ts: number; endpoint: TxEndpoint; filteredOut?: boolean };

type FakeQuery = FetchTxsPageParams & { endpoint: TxEndpoint; offset: number };

function toTxInfo(record: FakeRecord): TrongridTxInfo {
  return {
    txID: record.id,
    date: new Date(record.ts),
    blockHeight: record.ts,
    type: record.endpoint === "trc20" ? "TriggerSmartContract" : "TransferContract",
    from: address,
    value: new BigNumber(1),
    hasFailed: false,
    ...(record.endpoint === "trc20" && { tokenType: "trc20", tokenAddress: TRC20_CONTRACT }),
  };
}

const isFullPageEvenIfNothingFollows = (slice: FakeRecord[], query: FakeQuery) =>
  slice.length === query.limit;

function fakeTronGrid(records: FakeRecord[]) {
  const pageOf = (query: FakeQuery): TxEndpointPage => {
    const sign = query.order === "asc" ? 1 : -1;
    const matching = records
      .filter(r => r.endpoint === query.endpoint)
      .filter(r => r.ts >= query.minTimestamp)
      .filter(r => query.maxTimestamp === undefined || r.ts <= query.maxTimestamp)
      .sort((a, b) => sign * (a.ts - b.ts));
    const slice = matching.slice(query.offset, query.offset + query.limit);
    return {
      rawTimestamps: slice.map(r => r.ts),
      txs: slice.filter(r => !r.filteredOut).map(toTxInfo),
      next: isFullPageEvenIfNothingFollows(slice, query)
        ? JSON.stringify({ ...query, offset: query.offset + query.limit })
        : undefined,
    };
  };

  (fetchTronAccountTxsPage as jest.Mock).mockImplementation(
    async (_logger, _config, _address, params: FetchTxsPageParams) => ({
      native: pageOf({ ...params, endpoint: "native", offset: 0 }),
      trc20: pageOf({ ...params, endpoint: "trc20", offset: 0 }),
    }),
  );
  (fetchTronAccountTxsEndpointPage as jest.Mock).mockImplementation(
    async (_logger, _config, endpoint: TxEndpoint, url: string) => {
      const query: FakeQuery = JSON.parse(url);
      expect(query.endpoint).toBe(endpoint);
      return pageOf(query);
    },
  );
}

const native = (id: string, ts: number, kept = true): FakeRecord => ({
  id,
  ts,
  endpoint: "native",
  filteredOut: !kept,
});
const trc20 = (id: string, ts: number): FakeRecord => ({ id, ts, endpoint: "trc20" });

async function walkLikePaginateOperations(
  options: Partial<ListOperationsOptions>,
): Promise<string[]> {
  const ids: string[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 100; page++) {
    const result = await listOperations(logger, config, address, {
      limit: 3,
      minTimestamp: 0,
      order: "desc",
      ...options,
      cursor,
    });
    ids.push(...result.items.map(op => op.id));
    if (!result.next) return ids;
    expect(seen.has(result.next)).toBe(false);
    seen.add(result.next);
    cursor = result.next;
  }
  throw new Error("walk did not end");
}

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBlock as jest.Mock).mockImplementation(async (_logger, _config, height: number) => ({
      height,
      hash: `block-${height}`,
      time: new Date(height),
    }));
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation((tx: TrongridTxInfo) => ({
      id: tx.tokenType === "trc20" ? `${tx.txID}:trc20` : tx.txID,
    }));
  });

  describe("walks the whole history across both endpoints", () => {
    it("returns native operations older than the oldest TRC20 transfer", async () => {
      fakeTronGrid([
        native("n9", 9000),
        native("n7", 7000),
        native("n5", 5000),
        native("n4", 4000),
        native("n3", 3000),
        native("n2", 2000),
        native("n1", 1000),
        trc20("t8", 8000),
        trc20("t6", 6000),
      ]);

      expect(await walkLikePaginateOperations({ order: "desc" })).toEqual([
        "n9",
        "t8:trc20",
        "n7",
        "t6:trc20",
        "n5",
        "n4",
        "n3",
        "n2",
        "n1",
      ]);
    });

    it("returns TRC20 transfers older than the oldest native operation", async () => {
      fakeTronGrid([
        trc20("t9", 9000),
        trc20("t7", 7000),
        trc20("t5", 5000),
        trc20("t4", 4000),
        trc20("t3", 3000),
        trc20("t2", 2000),
        native("n8", 8000),
        native("n6", 6000),
      ]);

      expect(await walkLikePaginateOperations({ order: "desc" })).toEqual([
        "t9:trc20",
        "n8",
        "t7:trc20",
        "n6",
        "t5:trc20",
        "t4:trc20",
        "t3:trc20",
        "t2:trc20",
      ]);
    });

    it("walks the same history in ascending order", async () => {
      fakeTronGrid([
        native("n1", 1000),
        native("n2", 2000),
        native("n3", 3000),
        native("n4", 4000),
        native("n7", 7000),
        native("n9", 9000),
        trc20("t5", 5000),
        trc20("t6", 6000),
      ]);

      expect(await walkLikePaginateOperations({ order: "asc" })).toEqual([
        "n1",
        "n2",
        "n3",
        "n4",
        "t5:trc20",
        "t6:trc20",
        "n7",
        "n9",
      ]);
    });

    it("stops at minTimestamp", async () => {
      fakeTronGrid([native("n3", 3000), native("n2", 2000), native("n1", 1000)]);

      expect(
        await walkLikePaginateOperations({ order: "desc", limit: 1, minTimestamp: 2000 }),
      ).toEqual(["n3", "n2"]);
    });

    it("ends without error when a full last page links to an empty one", async () => {
      fakeTronGrid([native("n3", 3000), native("n2", 2000), native("n1", 1000)]);

      expect(await walkLikePaginateOperations({ order: "desc", limit: 3 })).toEqual([
        "n3",
        "n2",
        "n1",
      ]);
      expect(await walkLikePaginateOperations({ order: "desc", limit: 1 })).toEqual([
        "n3",
        "n2",
        "n1",
      ]);
    });
  });

  describe("cuts pages on raw records, not on filtered ones", () => {
    it("continues when the last native records of a page are filtered out", async () => {
      fakeTronGrid([
        native("n6", 6000),
        native("n5", 5000, false),
        native("n4", 4000, false),
        native("n3", 3000),
        native("n2", 2000, false),
        native("n1", 1000),
        trc20("t7", 7000),
        trc20("t4", 4500),
      ]);

      expect(await walkLikePaginateOperations({ order: "desc", limit: 2 })).toEqual([
        "t7:trc20",
        "n6",
        "t4:trc20",
        "n3",
        "n1",
      ]);
    });

    it("returns an empty page with a cursor, instead of throwing, when every record is filtered out", async () => {
      fakeTronGrid([
        native("n6", 6000, false),
        native("n5", 5000, false),
        native("n4", 4000, false),
        native("n3", 3000),
        native("n2", 2000),
      ]);

      const first = await listOperations(logger, config, address, {
        limit: 3,
        minTimestamp: 0,
        order: "desc",
      });

      expect(first.items).toEqual([]);
      expect(first.next).toBe("4000");
      expect(await walkLikePaginateOperations({ order: "desc" })).toEqual(["n3", "n2"]);
    });
  });

  describe("never splits a group of records sharing one timestamp", () => {
    it("returns every record of a group larger than a page", async () => {
      const group = ["a", "b", "c", "d", "e", "f", "g"].map(id => native(id, 5000));
      fakeTronGrid([native("n9", 9000), ...group, native("n1", 1000)]);

      expect(await walkLikePaginateOperations({ order: "desc" })).toEqual([
        "n9",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "n1",
      ]);
      expect(await walkLikePaginateOperations({ order: "asc" })).toEqual([
        "n1",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "n9",
      ]);
    });

    it("returns a group larger than a page on both endpoints at once", async () => {
      fakeTronGrid([
        native("n9", 9000),
        ...["a", "b", "c", "d"].map(id => native(id, 5000)),
        ...["w", "x", "y", "z"].map(id => trc20(id, 5000)),
        trc20("t1", 1000),
      ]);

      const ids = await walkLikePaginateOperations({ order: "desc" });

      expect(ids).toHaveLength(10);
      expect(new Set(ids)).toEqual(
        new Set(["n9", "a", "b", "c", "d", "w:trc20", "x:trc20", "y:trc20", "z:trc20", "t1:trc20"]),
      );
      expect(ids[0]).toBe("n9");
      expect(ids[9]).toBe("t1:trc20");
    });

    it("emits one operation for the TRC20 records of one transaction, on one page", async () => {
      fakeTronGrid([
        trc20("t9", 9000),
        trc20("multi", 5000),
        trc20("multi", 5000),
        trc20("multi", 5000),
        trc20("t1", 1000),
      ]);

      const pages: string[][] = [];
      let cursor: string | undefined;
      do {
        const result = await listOperations(logger, config, address, {
          limit: 2,
          minTimestamp: 0,
          order: "desc",
          cursor,
        });
        pages.push(result.items.map(op => op.id));
        cursor = result.next;
      } while (cursor);

      const multiPages = pages.filter(page => page.includes("multi:trc20"));
      expect(multiPages).toEqual([["multi:trc20"]]);
    });
  });

  describe("a transaction returned by both endpoints", () => {
    it("gives one operation, built from its TRC20 record", async () => {
      fakeTronGrid([native("n9", 9000), native("x", 5000), trc20("x", 5000), native("n1", 1000)]);

      expect(await walkLikePaginateOperations({ order: "desc" })).toEqual(["n9", "x:trc20", "n1"]);
    });

    it("gives one operation when its two records sit at the end of different pages", async () => {
      fakeTronGrid([
        native("n9", 9000),
        native("x", 5000),
        trc20("t8", 8000),
        trc20("t7", 7000),
        trc20("t6", 6000),
        trc20("x", 5000),
      ]);

      expect(await walkLikePaginateOperations({ order: "desc", limit: 2 })).toEqual([
        "n9",
        "t8:trc20",
        "t7:trc20",
        "t6:trc20",
        "x:trc20",
      ]);
    });
  });

  it("throws TronEmptyPage when TronGrid returns no record at all for a cursor", async () => {
    fakeTronGrid([]);

    await expect(
      listOperations(logger, config, address, {
        limit: 3,
        minTimestamp: 0,
        order: "desc",
        cursor: "5000",
      }),
    ).rejects.toThrow(TronEmptyPage);
  });

  it("throws TronPageServedTwice when a next link leads back to an already read page", async () => {
    const loop: TxEndpointPage = { rawTimestamps: [5000], txs: [], next: "page-2" };
    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      native: loop,
      trc20: { rawTimestamps: [], txs: [] },
    });
    (fetchTronAccountTxsEndpointPage as jest.Mock).mockResolvedValue(loop);

    await expect(
      listOperations(logger, config, address, { limit: 1, minTimestamp: 0, order: "desc" }),
    ).rejects.toThrow(TronPageServedTwice);
  });

  it("follows an empty page that still links to more records", async () => {
    const pages: Record<string, TxEndpointPage> = {
      "native-2": { rawTimestamps: [2000], txs: [toTxInfo(native("n2", 2000))] },
    };
    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      native: { rawTimestamps: [], txs: [], next: "native-2" },
      trc20: { rawTimestamps: [3000], txs: [toTxInfo(trc20("t3", 3000))] },
    });
    (fetchTronAccountTxsEndpointPage as jest.Mock).mockImplementation(
      async (_logger, _config, _endpoint, url: string) => pages[url],
    );

    const result = await listOperations(logger, config, address, {
      limit: 1,
      minTimestamp: 0,
      order: "desc",
    });

    expect(result.items.map(op => op.id)).toEqual(["t3:trc20", "n2"]);
    expect(result.next).toBeUndefined();
  });

  it("reads a timestamp group across an empty page in the middle of it", async () => {
    const pages: Record<string, TxEndpointPage> = {
      "native-2": { rawTimestamps: [], txs: [], next: "native-3" },
      "native-3": {
        rawTimestamps: [5000, 1000],
        txs: [toTxInfo(native("b", 5000)), toTxInfo(native("n1", 1000))],
      },
    };
    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      native: { rawTimestamps: [5000], txs: [toTxInfo(native("a", 5000))], next: "native-2" },
      trc20: { rawTimestamps: [], txs: [] },
    });
    (fetchTronAccountTxsEndpointPage as jest.Mock).mockImplementation(
      async (_logger, _config, _endpoint, url: string) => pages[url],
    );

    const result = await listOperations(logger, config, address, {
      limit: 1,
      minTimestamp: 0,
      order: "desc",
    });

    expect(result.items.map(op => op.id)).toEqual(["a", "b"]);
    expect(result.next).toBe("4999");
  });

  it("throws on an invalid cursor", async () => {
    await expect(
      listOperations(logger, config, address, {
        limit: 3,
        minTimestamp: 0,
        order: "desc",
        cursor: "invalid",
      }),
    ).rejects.toThrow("Invalid cursor format");
  });

  it("queries below the cursor in desc order and above it in asc order", async () => {
    fakeTronGrid([native("n1", 1000)]);

    await listOperations(logger, config, address, {
      limit: 3,
      minTimestamp: 500,
      order: "desc",
      cursor: "4000",
    });
    expect(fetchTronAccountTxsPage).toHaveBeenLastCalledWith(logger, config, address, {
      limit: 3,
      minTimestamp: 500,
      maxTimestamp: 4000,
      order: "desc",
    });

    await listOperations(logger, config, address, {
      limit: 3,
      minTimestamp: 500,
      order: "asc",
      cursor: "800",
    });
    expect(fetchTronAccountTxsPage).toHaveBeenLastCalledWith(logger, config, address, {
      limit: 3,
      minTimestamp: 800,
      maxTimestamp: undefined,
      order: "asc",
    });
  });

  it("drops a token operation whose asset reference could not be resolved", async () => {
    const tx = (txID: string, ts: number, extra: Partial<TrongridTxInfo>): TrongridTxInfo => ({
      ...toTxInfo(trc20(txID, ts)),
      ...extra,
    });
    const txs = [
      tx("tx-resolved", 3000, {}),
      tx("tx-unresolved", 2000, { tokenAddress: undefined }),
      tx("tx-unresolved-trc10", 1000, { tokenType: "trc10", tokenAddress: undefined }),
    ];
    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      native: { rawTimestamps: [], txs: [] },
      trc20: { rawTimestamps: txs.map(t => t.date.getTime()), txs },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(t => ({ id: t.txID }));

    const result = await listOperations(logger, config, address, {
      limit: 3,
      minTimestamp: 0,
      order: "desc",
    });

    expect(result.items.map(op => op.id)).toEqual(["tx-resolved"]);
  });

  it("fetches no block for a page of only unresolvable token operations", async () => {
    const unresolved = { ...toTxInfo(trc20("tx-unresolved", 1000)), tokenAddress: undefined };
    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      native: { rawTimestamps: [], txs: [] },
      trc20: { rawTimestamps: [1000], txs: [unresolved] },
    });

    const result = await listOperations(logger, config, address, {
      limit: 3,
      minTimestamp: 0,
      order: "desc",
    });

    expect(result.items).toEqual([]);
    expect(getBlock).not.toHaveBeenCalled();
  });

  it("propagates a network error", async () => {
    (fetchTronAccountTxsPage as jest.Mock).mockRejectedValue(new Error("Network error!"));

    await expect(
      listOperations(logger, config, address, { limit: 3, minTimestamp: 0, order: "desc" }),
    ).rejects.toThrow("Network error!");
  });
});
