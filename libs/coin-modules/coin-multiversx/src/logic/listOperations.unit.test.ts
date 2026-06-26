import BigNumber from "bignumber.js";

import { listOperations } from "./listOperations";
import type { MultiversXApiTransaction } from "../types";
import { MultiversXTransferOptions } from "../types";

type GetTransfersOptions = {
  size: number;
  from?: number;
  before?: number;
  after?: number;
  order?: "asc" | "desc";
};

type MockApiClient = {
  getTransfers: jest.Mock<Promise<MultiversXApiTransaction[]>, [string, GetTransfersOptions]>;
};

const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const otherAddress = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

const createTransfer = (
  overrides: {
    [K in keyof MultiversXApiTransaction]?: MultiversXApiTransaction[K] | undefined;
  } = {},
): MultiversXApiTransaction =>
  ({
    mode: "send",
    fees: undefined,
    txHash: `tx-${Math.random().toString(36).substring(7)}`,
    sender: otherAddress,
    receiver: testAddress,
    value: new BigNumber("1000000000000000000"),
    fee: new BigNumber("50000000000000"),
    round: 1000,
    timestamp: 1_700_000_000,
    status: "success",
    gasLimit: 50000,
    type: "Transaction",
    ...overrides,
  }) as MultiversXApiTransaction;

const createEsdtTransfer = (
  overrides: {
    [K in keyof MultiversXApiTransaction]?: MultiversXApiTransaction[K] | undefined;
  } = {},
): MultiversXApiTransaction =>
  createTransfer({
    value: new BigNumber("0"),
    transfer: MultiversXTransferOptions.esdt,
    tokenIdentifier: "USDC-c76f1f",
    tokenValue: "1000000",
    ...overrides,
  });

const createMockApiClient = (transfers: MultiversXApiTransaction[] = []): MockApiClient => ({
  getTransfers: jest.fn().mockImplementation((_addr: string, opts: GetTransfersOptions) => {
    const order = opts.order ?? "desc";
    const sorted = [...transfers].sort((a, b) => {
      const ta = a.timestamp ?? 0;
      const tb = b.timestamp ?? 0;
      if (ta !== tb) return order === "asc" ? ta - tb : tb - ta;
      return (a.txHash ?? "").localeCompare(b.txHash ?? "");
    });
    const windowed = sorted.filter(t => {
      const ts = t.timestamp ?? 0;
      if (opts.before !== undefined && ts > opts.before) return false;
      if (opts.after !== undefined && ts < opts.after) return false;
      return true;
    });
    const from = opts.from ?? 0;
    return Promise.resolve(windowed.slice(from, from + opts.size));
  }),
});

describe("listOperations", () => {
  describe("address validation", () => {
    it("throws a descriptive error for an invalid address", async () => {
      const api = createMockApiClient([]);
      await expect(
        listOperations(api, "not-a-valid-erd-address", { minHeight: 0 }),
      ).rejects.toThrow("Invalid MultiversX address: not-a-valid-erd-address");
      expect(api.getTransfers).not.toHaveBeenCalled();
    });
  });

  describe("operation mapping", () => {
    it("maps an incoming native transfer to an IN operation", async () => {
      const api = createMockApiClient([
        createTransfer({
          txHash: "hash-in",
          value: new BigNumber("5000000000000000000"),
          sender: otherAddress,
          receiver: testAddress,
          round: 12345,
        }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0 });

      expect(items[0]).toMatchObject({
        id: "hash-in",
        type: "IN",
        value: 5000000000000000000n,
        asset: { type: "native" },
        senders: [otherAddress],
        recipients: [testAddress],
      });
      expect(items[0].tx.block.height).toBe(12345);
    });

    it("maps an outgoing transfer (sender is the account) to an OUT operation", async () => {
      const api = createMockApiClient([
        createTransfer({ sender: testAddress, receiver: otherAddress }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0 });

      expect(items[0].type).toBe("OUT");
    });

    it("maps an ESDT transfer using the enriched token fields", async () => {
      const api = createMockApiClient([
        createEsdtTransfer({
          txHash: "esdt-1",
          tokenIdentifier: "USDC-c76f1f",
          tokenValue: "1000000",
        }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0 });

      expect(items[0].asset).toEqual({ type: "esdt", assetReference: "USDC-c76f1f" });
      expect(items[0].value).toBe(1000000n);
    });

    it("returns both native and ESDT operations from the single stream", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "egld-1", round: 2000, timestamp: 200 }),
        createEsdtTransfer({ txHash: "esdt-1", round: 1500, timestamp: 150 }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0 });

      expect(items).toHaveLength(2);
      expect(items.some(op => op.asset.type === "native")).toBe(true);
      expect(items.some(op => op.asset.type === "esdt")).toBe(true);
    });

    it("excludes SmartContractResult items from the operation list", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "tx-1", timestamp: 300 }),
        createTransfer({ txHash: "scr-1", timestamp: 200, type: "SmartContractResult" }),
        createTransfer({ txHash: "tx-2", timestamp: 100 }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0 });

      expect(items.map(op => op.id)).toEqual(["tx-1", "tx-2"]);
    });
  });

  describe("empty results", () => {
    it("returns an empty page with no cursor", async () => {
      const api = createMockApiClient([]);
      const { items, next } = await listOperations(api, testAddress, { minHeight: 0 });
      expect(items).toEqual([]);
      expect(next).toBeUndefined();
    });
  });

  describe("ordering", () => {
    it("returns newest first by default (desc)", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "old", timestamp: 100, round: 100 }),
        createTransfer({ txHash: "new", timestamp: 300, round: 300 }),
        createTransfer({ txHash: "mid", timestamp: 200, round: 200 }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0, order: "desc" });

      expect(items.map(op => op.tx.block.height)).toEqual([300, 200, 100]);
    });

    it("returns oldest first when order is asc", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "new", timestamp: 300, round: 300 }),
        createTransfer({ txHash: "old", timestamp: 100, round: 100 }),
        createTransfer({ txHash: "mid", timestamp: 200, round: 200 }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0, order: "asc" });

      expect(items.map(op => op.tx.block.height)).toEqual([100, 200, 300]);
    });

    it("breaks ties on same-second transactions by txHash ascending (both orders)", async () => {
      const transfers = [
        createTransfer({ txHash: "tx-z", timestamp: 100 }),
        createTransfer({ txHash: "tx-a", timestamp: 100 }),
        createTransfer({ txHash: "tx-m", timestamp: 100 }),
      ];

      const desc = await listOperations(createMockApiClient(transfers), testAddress, {
        minHeight: 0,
        order: "desc",
      });
      const asc = await listOperations(createMockApiClient(transfers), testAddress, {
        minHeight: 0,
        order: "asc",
      });

      expect(desc.items.map(op => op.id)).toEqual(["tx-a", "tx-m", "tx-z"]);
      expect(asc.items.map(op => op.id)).toEqual(["tx-a", "tx-m", "tx-z"]);
    });
  });

  describe("pagination", () => {
    it("requests a window sized to the limit and returns up to that many operations", async () => {
      const transfers = Array.from({ length: 20 }, (_, i) =>
        createTransfer({ txHash: `tx-${i}`, timestamp: 1000 + i }),
      );
      const api = createMockApiClient(transfers);

      const { items, next } = await listOperations(api, testAddress, { minHeight: 0, limit: 10 });

      expect(items).toHaveLength(10);
      expect(api.getTransfers).toHaveBeenCalledWith(
        testAddress,
        expect.objectContaining({ size: 10, order: "desc" }),
      );
      expect(typeof next).toBe("string");
    });

    it("returns no cursor when the page is not full", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "tx-1", timestamp: 100 }),
        createTransfer({ txHash: "tx-2", timestamp: 200 }),
      ]);

      const { next } = await listOperations(api, testAddress, { minHeight: 0, limit: 10 });

      expect(next).toBeUndefined();
    });

    it("emits a next cursor in {timestamp}:{txHash} format", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "newer", timestamp: 5678 }),
        createTransfer({ txHash: "older", timestamp: 1234 }),
      ]);

      const { items, next } = await listOperations(api, testAddress, { minHeight: 0, limit: 1 });

      expect(items[0].id).toBe("newer");
      expect(next).toBe("5678:newer");
    });

    it("paginates through distinct-timestamp transactions (desc) with no gaps or duplicates", async () => {
      const transfers = [
        createTransfer({ txHash: "tx-5", timestamp: 500, round: 500 }),
        createTransfer({ txHash: "tx-4", timestamp: 400, round: 400 }),
        createTransfer({ txHash: "tx-3", timestamp: 300, round: 300 }),
        createTransfer({ txHash: "tx-2", timestamp: 200, round: 200 }),
        createTransfer({ txHash: "tx-1", timestamp: 100, round: 100 }),
      ];
      const api = createMockApiClient(transfers);

      const seen: string[] = [];
      let cursor: string | undefined;
      for (let guard = 0; guard < 10; guard++) {
        const page = await listOperations(api, testAddress, {
          minHeight: 0,
          limit: 2,
          ...(cursor !== undefined ? { cursor } : {}),
        });
        seen.push(...page.items.map(op => op.id));
        if (!page.next) break;
        cursor = page.next;
      }

      expect(seen).toEqual(["tx-5", "tx-4", "tx-3", "tx-2", "tx-1"]);
      expect(new Set(seen).size).toBe(5);
    });

    it("paginates through same-second transactions across a page boundary with no gaps or duplicates", async () => {
      const transfers = [
        createTransfer({ txHash: "tx-a", timestamp: 100 }),
        createTransfer({ txHash: "tx-b", timestamp: 100 }),
        createTransfer({ txHash: "tx-c", timestamp: 100 }),
      ];
      const api = createMockApiClient(transfers);

      const page1 = await listOperations(api, testAddress, { minHeight: 0, limit: 2 });
      expect(page1.items.map(op => op.id)).toEqual(["tx-a", "tx-b"]);
      expect(page1.next).toBe("100:tx-b");

      const seen = [...page1.items.map(op => op.id)];
      let cursor = page1.next;
      for (let guard = 0; guard < 10 && cursor; guard++) {
        const page = await listOperations(api, testAddress, {
          minHeight: 0,
          limit: 2,
          ...(cursor !== undefined ? { cursor } : {}),
        });
        seen.push(...page.items.map(op => op.id));
        cursor = page.next;
      }

      expect(seen).toEqual(["tx-a", "tx-b", "tx-c"]);
      expect(new Set(seen).size).toBe(3);
    });

    it("offset-drains a single second denser than the window instead of dropping items", async () => {
      // Five transfers share one second; the cursor sits in the middle. With
      // limit 2 the first window (tx-a, tx-b, tx-c) is entirely at-or-before the
      // cursor and gets filtered out, so the timestamp cursor cannot advance. The
      // fetch must offset-page (from: 3) to surface tx-d, tx-e rather than stop.
      const transfers = ["tx-a", "tx-b", "tx-c", "tx-d", "tx-e"].map(txHash =>
        createTransfer({ txHash, timestamp: 100 }),
      );
      const api = createMockApiClient(transfers);

      const { items } = await listOperations(api, testAddress, {
        minHeight: 0,
        limit: 2,
        cursor: "100:tx-c",
      });

      expect(items.map(op => op.id)).toEqual(["tx-d", "tx-e"]);
      expect(api.getTransfers).toHaveBeenCalledTimes(2);
      expect(api.getTransfers).toHaveBeenNthCalledWith(
        1,
        testAddress,
        expect.objectContaining({ from: 0 }),
      );
      expect(api.getTransfers).toHaveBeenNthCalledWith(
        2,
        testAddress,
        expect.objectContaining({ from: 3 }),
      );
    });

    it("drops transfers missing a txHash rather than emitting empty operation ids", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "tx-2", timestamp: 200 }),
        createTransfer({ txHash: undefined, timestamp: 150 }),
        createTransfer({ txHash: "tx-1", timestamp: 100 }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0, limit: 10 });

      expect(items.map(op => op.id)).toEqual(["tx-2", "tx-1"]);
      expect(items.every(op => op.id !== "")).toBe(true);
    });

    it("paginates in ascending order", async () => {
      const transfers = [
        createTransfer({ txHash: "tx-1", timestamp: 100 }),
        createTransfer({ txHash: "tx-2", timestamp: 200 }),
        createTransfer({ txHash: "tx-3", timestamp: 300 }),
      ];
      const api = createMockApiClient(transfers);

      const page1 = await listOperations(api, testAddress, {
        minHeight: 0,
        limit: 2,
        order: "asc",
      });
      expect(page1.items.map(op => op.id)).toEqual(["tx-1", "tx-2"]);

      const page2 = await listOperations(api, testAddress, {
        minHeight: 0,
        limit: 2,
        order: "asc",
        ...(page1.next !== undefined ? { cursor: page1.next } : {}),
      });
      expect(page2.items.map(op => op.id)).toEqual(["tx-3"]);
      expect(page2.next).toBeUndefined();
    });

    it("ignores an unparseable cursor and returns the first page", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "tx-1", timestamp: 100 }),
        createTransfer({ txHash: "tx-2", timestamp: 200 }),
      ]);

      const { items } = await listOperations(api, testAddress, {
        minHeight: 0,
        cursor: "not-a-number",
      });

      expect(items).toHaveLength(2);
      expect(api.getTransfers).toHaveBeenCalledWith(
        testAddress,
        expect.not.objectContaining({ before: expect.anything() }),
      );
    });

    it("treats a legacy hash-less cursor as an exclusive timestamp boundary", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "tx-a", timestamp: 100 }),
        createTransfer({ txHash: "tx-b", timestamp: 100 }),
        createTransfer({ txHash: "tx-c", timestamp: 50 }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 0, cursor: "100" });

      expect(items.map(op => op.id)).toEqual(["tx-c"]);
    });
  });

  describe("minHeight filtering", () => {
    it("filters out operations below minHeight (by block height)", async () => {
      const api = createMockApiClient([
        createTransfer({ txHash: "tx-hi", timestamp: 300, round: 3000 }),
        createTransfer({ txHash: "tx-mid", timestamp: 200, round: 2000 }),
        createTransfer({ txHash: "tx-lo", timestamp: 100, round: 500 }),
      ]);

      const { items } = await listOperations(api, testAddress, { minHeight: 1500 });

      expect(items.map(op => op.tx.block.height)).toEqual([3000, 2000]);
    });

    it("stops paginating (no cursor) once a desc page drops below minHeight", async () => {
      const transfers = Array.from({ length: 4 }, (_, i) =>
        createTransfer({ txHash: `tx-${i}`, timestamp: 100 * (i + 1), round: 100 * (i + 1) }),
      );
      const api = createMockApiClient(transfers);

      const page1 = await listOperations(api, testAddress, { minHeight: 250, limit: 2 });
      expect(page1.items.map(op => op.tx.block.height)).toEqual([400, 300]);

      const page2 = await listOperations(api, testAddress, {
        minHeight: 250,
        limit: 2,
        ...(page1.next !== undefined ? { cursor: page1.next } : {}),
      });
      expect(page2.items.every(op => op.tx.block.height >= 250)).toBe(true);
      expect(page2.next).toBeUndefined();
    });
  });
});
