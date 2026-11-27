import BigNumber from "bignumber.js";
import { http, HttpResponse } from "msw";
import { setCoinConfig } from "../config";
import {
  fetchLegacyHistory,
  fetchReceiptsPage,
  fetchTransactionsPage,
  getOperations,
  isReceiptTransferCandidate,
  readReceiptTransfers,
} from "./indexer";
import { mockNearConfig } from "../test/context";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";
import { NearAccountReceipt, NearReceiptNode, NearTransaction } from "./sdk.types";

const ACCOUNT_ID = "accountId";
const ADDRESS = "sender.near";

const txn = (overrides: Partial<NearTransaction> = {}): NearTransaction => ({
  signer_account_id: ADDRESS,
  receiver_account_id: "receiver.near",
  transaction_hash: "GgQ6xTuNhTNGVsRAhLFGRUBB1cUv9kmvhBZBrLPZbNSJ",
  block_timestamp: "1755192310610741506",
  block: {
    block_hash: "DsWyc6swGSDezgvweB561FLbL1nsBsU3QJtZFLHq79Ru",
    block_height: "159618979",
    block_timestamp: "1755192310610741506",
  },
  outcomes: { status: true },
  outcomes_agg: { transaction_fee: "1114233164157900000000" },
  actions_agg: { deposit: "10000000000000000000000" },
  actions: [{ action: "TRANSFER", method: null }],
  ...overrides,
});

let lastRequestUrl: URL | undefined;

const respondWith = (data: NearTransaction[] | null): void => {
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, ({ request }) => {
      lastRequestUrl = new URL(request.url);
      return HttpResponse.json({ data });
    }),
  );
};

const INTENTS = "intents.near";
const PAYOUT = "10000000000000000000000000";

const receipt = (overrides: Partial<NearAccountReceipt> = {}): NearAccountReceipt => ({
  receipt_id: "receipt-1",
  transaction_hash: "payout-hash",
  predecessor_account_id: INTENTS,
  receiver_account_id: ADDRESS,
  included_in_block_timestamp: "1755192310610741506",
  block: {
    block_hash: "ReceiptBlockHash",
    block_height: "159618980",
    block_timestamp: "1755192310610741506",
  },
  actions_agg: { deposit: PAYOUT },
  actions: [{ action: "TRANSFER", method: null }],
  outcome: { status: true },
  ...overrides,
});

let lastReceiptsUrl: URL | undefined;
let partiesLookups: string[] = [];
let servedReceipts: NearAccountReceipt[] = [];

type Parties = { signer_account_id: string; receiver_account_id: string };

const serve = (rows: NearAccountReceipt[] | null): void => {
  servedReceipts.push(...(rows ?? []));
};

const respondWithReceipts = (data: NearAccountReceipt[] | null, nextPage?: string): void => {
  serve(data);
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/receipts`, ({ request }) => {
      lastReceiptsUrl = new URL(request.url);
      return HttpResponse.json({ data, ...(nextPage && { meta: { next_page: nextPage } }) });
    }),
  );
};

/** Serves receipt pages by cursor: the first with no cursor, each next as `page-<index>`. */
const respondWithReceiptPages = (pages: NearAccountReceipt[][]): { cursors: string[] } => {
  pages.forEach(serve);
  const cursors: string[] = [];
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/receipts`, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get("next") ?? "";
      cursors.push(cursor);
      const index = cursor === "" ? 0 : Number(cursor.replace("page-", ""));
      return HttpResponse.json({
        data: pages[index],
        ...(index + 1 < pages.length && { meta: { next_page: `page-${index + 1}` } }),
      });
    }),
  );
  return { cursors };
};

const receiptNode = (row: NearAccountReceipt): NearReceiptNode => ({
  predecessor_account_id: row.predecessor_account_id,
  receiver_account_id: row.receiver_account_id,
  actions: (row.actions ?? []).map(action => ({
    ...action,
    args: { deposit: row.actions_agg?.deposit ?? "0" },
  })),
  outcome: row.outcome as NearReceiptNode["outcome"],
  ...(row.block && { block: row.block }),
});

/** Serves each transaction's receipt tree: its parties at the root, the served rows of that hash below. */
const respondWithParties = (
  parties: Record<string, Parties | null> = {},
  fallback: Parties = { signer_account_id: INTENTS, receiver_account_id: INTENTS },
  extraNodes: Record<string, NearReceiptNode[]> = {},
): void => {
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}/v3/txns/:hash/receipts`, ({ params }) => {
      const hash = String(params.hash);
      partiesLookups.push(hash);
      const root = hash in parties ? parties[hash] : fallback;
      if (!root) return HttpResponse.json({ data: null });
      return HttpResponse.json({
        data: {
          predecessor_account_id: root.signer_account_id,
          receiver_account_id: root.receiver_account_id,
          actions: [{ action: "FUNCTION_CALL", method: "execute_intents" }],
          outcome: { status: true },
          receipts: [
            ...servedReceipts.filter(row => row.transaction_hash === hash).map(receiptNode),
            ...(extraNodes[hash] ?? []),
          ],
        },
      });
    }),
  );
};

const read = (options: Partial<Parameters<typeof readReceiptTransfers>[2]> = {}) =>
  readReceiptTransfers(mockNearConfig, ADDRESS, { knownHashes: new Set(), ...options });

describe("getOperations", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      name: "NEAR",
      unit: { name: "NEAR", code: "NEAR", magnitude: 24 },
      infra: {
        API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
        API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    servedReceipts = [];
    respondWithReceipts([]);
    respondWithParties();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    lastRequestUrl = undefined;
    lastReceiptsUrl = undefined;
    partiesLookups = [];
  });

  afterAll(() => {
    mockServer.close();
  });

  describe("request", () => {
    it("targets the v3 account txns endpoint", async () => {
      respondWith([]);

      await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(lastRequestUrl?.pathname).toBe(`/v3/accounts/${ADDRESS}/txns`);
    });

    it("sends no paging params, preserving the v1 default page size", async () => {
      respondWith([]);

      await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(lastRequestUrl?.searchParams.get("limit")).toBeNull();
      expect(lastRequestUrl?.search).toBe("");
    });
  });

  describe("envelope", () => {
    it("unwraps data", async () => {
      respondWith([txn(), txn({ transaction_hash: "second" })]);

      const operations = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operations).toHaveLength(2);
    });

    it("returns no operations when data is null", async () => {
      respondWith(null);

      const operations = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operations).toEqual([]);
    });
  });

  describe("operation type", () => {
    it.each([
      ["deposit_and_stake", "STAKE"],
      ["unstake", "UNSTAKE"],
      ["unstake_all", "UNSTAKE"],
      ["withdraw", "WITHDRAW_UNSTAKED"],
      ["withdraw_all", "WITHDRAW_UNSTAKED"],
    ])("maps method %s to %s", async (method, expected) => {
      respondWith([txn({ actions: [{ action: "FUNCTION_CALL", method }] })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.type).toBe(expected);
    });

    it("falls back to OUT when the account is the signer", async () => {
      respondWith([txn({ actions: [{ action: "TRANSFER", method: null }] })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.type).toBe("OUT");
    });

    it("falls back to IN when the account is not the signer", async () => {
      respondWith([
        txn({
          signer_account_id: "someone-else.near",
          actions: [{ action: "TRANSFER", method: null }],
        }),
      ]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.type).toBe("IN");
    });

    it("falls back to OUT/IN for an unknown method", async () => {
      respondWith([txn({ actions: [{ action: "FUNCTION_CALL", method: "mint_sbt" }] })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.type).toBe("OUT");
    });
  });

  describe("operation value", () => {
    it("reads the aggregated deposit", async () => {
      respondWith([
        txn({
          actions: [{ action: "FUNCTION_CALL", method: "deposit_and_stake" }],
          actions_agg: { deposit: "5000000000000000000000" },
        }),
      ]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.value.toFixed()).toBe("5000000000000000000000");
    });

    it("adds the transaction fee for an outgoing operation", async () => {
      respondWith([
        txn({
          actions_agg: { deposit: "10000000000000000000000" },
          outcomes_agg: { transaction_fee: "1114233164157900000000" },
        }),
      ]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.type).toBe("OUT");
      expect(operation.value.toFixed()).toBe("11114233164157900000000");
      expect(operation.fee.toFixed()).toBe("1114233164157900000000");
    });

    it("preserves full yoctoNEAR precision", async () => {
      respondWith([
        txn({
          signer_account_id: "someone-else.near",
          actions_agg: { deposit: "123456789012345678901234" },
        }),
      ]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.value.toFixed()).toBe("123456789012345678901234");
    });
  });

  describe("block fields", () => {
    it("reads the block hash from the block object", async () => {
      respondWith([txn()]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.blockHash).toBe("DsWyc6swGSDezgvweB561FLbL1nsBsU3QJtZFLHq79Ru");
    });

    it("converts the block height from string to number", async () => {
      respondWith([txn({ block: { block_height: "159618979" } })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.blockHeight).toBe(159618979);
    });

    it("leaves block fields undefined when the block object is empty", async () => {
      respondWith([txn({ block: {} })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.blockHash).toBeUndefined();
      expect(operation.blockHeight).toBeUndefined();
    });

    it("derives the date from the nanosecond timestamp", async () => {
      respondWith([txn({ block_timestamp: "1755192310610741506" })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.date).toEqual(new Date(1755192310610));
    });
  });

  describe("failure flag", () => {
    it("is false for a successful outcome", async () => {
      respondWith([txn({ outcomes: { status: true } })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.hasFailed).toBe(false);
    });

    it("is true for a failed outcome", async () => {
      respondWith([txn({ outcomes: { status: false } })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.hasFailed).toBe(true);
    });

    it("is false when the status is absent, since the outcome is not indexed yet", async () => {
      respondWith([txn({ outcomes: {} })]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.hasFailed).toBe(false);
    });

    it("is false when the outcomes object itself is absent", async () => {
      const malformed = txn();
      delete malformed.outcomes;
      respondWith([malformed]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.hasFailed).toBe(false);
    });
  });

  describe("participants", () => {
    it("maps senders and recipients", async () => {
      respondWith([txn()]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.senders).toEqual([ADDRESS]);
      expect(operation.recipients).toEqual(["receiver.near"]);
      expect(operation.hash).toBe("GgQ6xTuNhTNGVsRAhLFGRUBB1cUv9kmvhBZBrLPZbNSJ");
    });
  });

  describe("payloads captured from the indexer", () => {
    const functionCall = {
      actions: [{ action: "FUNCTION_CALL", method: "mint_sbt" }],
      actions_agg: { deposit: "10000000000000000000000" },
      block: {
        block_hash: "DsWyc6swGSDezgvweB561FLbL1nsBsU3QJtZFLHq79Ru",
        block_height: "159618979",
        block_timestamp: "1755192310610741506",
      },
      block_timestamp: "1755192310610741506",
      index_in_chunk: 12,
      outcomes: { status: true },
      outcomes_agg: { transaction_fee: "1114233164157900000000" },
      receiver_account_id: "initiate.nearlegion.near",
      shard_id: 4,
      signer_account_id: "nearkat.near",
      transaction_hash: "CRw2Fu7yATn2yxyDf1xyYfbZSBqjXi4hD9Lc7LeWm3bJ",
    };

    const notYetExecuted = {
      actions: [],
      actions_agg: { deposit: "0" },
      block: {
        block_hash: "Cs4y7fCpkv5yqhSyjPb7nQfRYK5SUhTWXxx9vxtjM4ce",
        block_height: "208952176",
        block_timestamp: "1785272779403516018",
      },
      block_timestamp: "1785272779403516018",
      index_in_chunk: 0,
      outcomes: {},
      outcomes_agg: { transaction_fee: "31382922951500000000" },
      receiver_account_id: "wrap.near",
      shard_id: 8,
      signer_account_id: "burrow-liquidation-bot-04.ref-labs.near",
      transaction_hash: "5U17hHtwFeqFswsimtvm7wjQeAZd1zeriJsuUd88rbWX",
    };

    it("maps a real FUNCTION_CALL transaction", async () => {
      respondWith([functionCall]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, "nearkat.near");

      expect(operation.type).toBe("OUT");
      expect(operation.value.toFixed()).toBe("11114233164157900000000");
      expect(operation.fee.toFixed()).toBe("1114233164157900000000");
      expect(operation.blockHash).toBe("DsWyc6swGSDezgvweB561FLbL1nsBsU3QJtZFLHq79Ru");
      expect(operation.blockHeight).toBe(159618979);
      expect(operation.senders).toEqual(["nearkat.near"]);
      expect(operation.recipients).toEqual(["initiate.nearlegion.near"]);
      expect(operation.hasFailed).toBe(false);
    });

    it("maps a real transaction whose outcome is not indexed yet", async () => {
      respondWith([notYetExecuted]);

      const [operation] = await getOperations(
        mockNearConfig,
        ACCOUNT_ID,
        "burrow-liquidation-bot-04.ref-labs.near",
      );

      expect(operation.type).toBe("OUT");
      expect(operation.value.toFixed()).toBe("31382922951500000000");
      expect(operation.blockHeight).toBe(208952176);
      expect(operation.hasFailed).toBe(false);
    });

    it("maps a full page of both shapes without dropping any operation", async () => {
      respondWith([functionCall, notYetExecuted]);

      const operations = await getOperations(mockNearConfig, ACCOUNT_ID, "nearkat.near");

      expect(operations).toHaveLength(2);
      expect(operations.map(operation => operation.hash)).toEqual([
        "CRw2Fu7yATn2yxyDf1xyYfbZSBqjXi4hD9Lc7LeWm3bJ",
        "5U17hHtwFeqFswsimtvm7wjQeAZd1zeriJsuUd88rbWX",
      ]);
    });
  });

  describe("resilience", () => {
    it.each(["actions_agg", "outcomes_agg", "outcomes", "block", "actions"] as const)(
      "keeps mapping the page when a transaction omits %s",
      async field => {
        const malformed = txn({ transaction_hash: "malformed" });
        delete malformed[field];
        respondWith([malformed, txn({ transaction_hash: "healthy" })]);

        const operations = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

        expect(operations).toHaveLength(2);
        expect(operations[1].value.toFixed()).toBe("11114233164157900000000");
      },
    );

    it("maps a transaction that carries nothing but its identity", async () => {
      respondWith([
        {
          signer_account_id: ADDRESS,
          receiver_account_id: "receiver.near",
          transaction_hash: "bare",
          block_timestamp: "1755192310610741506",
        },
      ]);

      const [operation] = await getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(operation.hash).toBe("bare");
      expect(operation.value.toFixed()).toBe("0");
      expect(operation.fee.toFixed()).toBe("0");
      expect(operation.blockHash).toBeUndefined();
      expect(operation.blockHeight).toBeUndefined();
      expect(operation.hasFailed).toBe(false);
    });
  });

  describe("rate limiting", () => {
    it("rejects after a single request when the indexer answers 429", async () => {
      let requests = 0;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, () => {
          requests += 1;
          return HttpResponse.json({ message: "Too Many Requests" }, { status: 429 });
        }),
      );

      await expect(getOperations(mockNearConfig, ACCOUNT_ID, ADDRESS)).rejects.toMatchObject({
        status: 429,
      });
      expect(requests).toBe(1);

      await expect(fetchTransactionsPage(mockNearConfig, ADDRESS)).rejects.toMatchObject({
        status: 429,
      });
      expect(requests).toBe(2);
    });
  });

  describe("fetchReceiptsPage", () => {
    it("sends the limit and the cursor, and returns the rows with the next cursor", async () => {
      respondWithReceipts([receipt()], "more");

      const page = await fetchReceiptsPage(mockNearConfig, ADDRESS, { cursor: "abc", limit: 100 });

      expect(lastReceiptsUrl?.pathname).toBe(`/v3/accounts/${ADDRESS}/receipts`);
      expect(lastReceiptsUrl?.searchParams.get("limit")).toBe("100");
      expect(lastReceiptsUrl?.searchParams.get("next")).toBe("abc");
      expect(page).toEqual({ receipts: [receipt()], next: "more" });
    });

    it("sends no params by default and returns no rows for null data", async () => {
      respondWithReceipts(null);

      const page = await fetchReceiptsPage(mockNearConfig, ADDRESS);

      expect(lastReceiptsUrl?.search).toBe("");
      expect(page).toEqual({ receipts: [] });
    });
  });

  describe("isReceiptTransferCandidate", () => {
    it("accepts a transfer with a deposit from another account", () => {
      expect(isReceiptTransferCandidate(receipt(), ADDRESS)).toBe(true);
    });

    it.each([
      ["a gas refund from the system", { predecessor_account_id: "system" }],
      ["a receipt the account sent itself", { predecessor_account_id: ADDRESS }],
      ["a receipt for another account", { receiver_account_id: "other.near" }],
      ["a zero deposit", { actions_agg: { deposit: "0" } }],
      ["no deposit", { actions_agg: undefined }],
      ["a call that is not a transfer", { actions: [{ action: "FUNCTION_CALL", method: "x" }] }],
      ["no actions", { actions: undefined }],
      ["a failed outcome", { outcome: { status: false } }],
      ["a pending outcome", { outcome: {} }],
    ] as [string, Partial<NearAccountReceipt>][])("rejects %s", (_name, overrides) => {
      expect(isReceiptTransferCandidate(receipt(overrides), ADDRESS)).toBe(false);
    });
  });

  describe("readReceiptTransfers", () => {
    it("keeps a payout and maps it", async () => {
      respondWithReceipts([receipt()]);

      const { transfers, truncatedAtHeight } = await read();

      expect(transfers).toEqual([
        {
          transactionHash: "payout-hash",
          sender: INTENTS,
          value: PAYOUT,
          blockHeight: 159618980,
          blockHash: "ReceiptBlockHash",
          date: new Date(1755192310610.7415),
        },
      ]);
      expect(truncatedAtHeight).toBeUndefined();
      expect(partiesLookups).toEqual(["payout-hash"]);
    });

    it("makes no lookup for a transaction it already knows", async () => {
      respondWithReceipts([receipt()]);

      const { transfers } = await read({ knownHashes: new Set(["payout-hash"]) });

      expect(transfers).toEqual([]);
      expect(partiesLookups).toEqual([]);
    });

    it("drops a candidate whose transaction the account signed", async () => {
      respondWithReceipts([receipt()]);
      respondWithParties({
        "payout-hash": { signer_account_id: ADDRESS, receiver_account_id: "pool.near" },
      });

      expect((await read()).transfers).toEqual([]);
    });

    it("drops a candidate whose transaction was addressed to the account", async () => {
      respondWithReceipts([receipt()]);
      respondWithParties({
        "payout-hash": { signer_account_id: "peer.near", receiver_account_id: ADDRESS },
      });

      expect((await read()).transfers).toEqual([]);
    });

    it("sums the receipts of one transaction into one transfer", async () => {
      respondWithReceipts([receipt({ receipt_id: "r1" }), receipt({ receipt_id: "r2" })]);

      const { transfers } = await read();

      expect(transfers).toHaveLength(1);
      expect(transfers[0].value).toBe("20000000000000000000000000");
      expect(partiesLookups).toEqual(["payout-hash"]);
    });

    it("skips rows at or above the upper height", async () => {
      respondWithReceipts([
        receipt({ transaction_hash: "above", block: { block_height: "200" } }),
        receipt({ transaction_hash: "at", block: { block_height: "150" } }),
        receipt({ transaction_hash: "below", block: { block_height: "149" } }),
      ]);

      const { transfers } = await read({ upperHeight: 150 });

      expect(transfers.map(t => t.transactionHash)).toEqual(["below"]);
    });

    it("skips rows without a block height", async () => {
      const withoutBlock = receipt();
      delete withoutBlock.block;
      respondWithReceipts([withoutBlock]);

      expect((await read()).transfers).toEqual([]);
    });

    it("stops below the floor and returns the cursor of the page it stopped in", async () => {
      const { cursors } = respondWithReceiptPages([
        [receipt({ transaction_hash: "a", block: { block_height: "300" } })],
        [
          receipt({ transaction_hash: "b", block: { block_height: "200" } }),
          receipt({ transaction_hash: "c", block: { block_height: "90" } }),
        ],
        [receipt({ transaction_hash: "d", block: { block_height: "50" } })],
      ]);

      const { transfers, resumeCursor, truncatedAtHeight } = await read({ floorHeight: 100 });

      expect(cursors).toEqual(["", "page-1"]);
      expect(transfers.map(t => t.transactionHash)).toEqual(["a", "b"]);
      expect(resumeCursor).toBe("page-1");
      expect(truncatedAtHeight).toBeUndefined();
    });

    it("keeps a row at the floor height", async () => {
      respondWithReceipts([receipt({ block: { block_height: "100" } })]);

      expect((await read({ floorHeight: 100 })).transfers).toHaveLength(1);
    });

    it("reads from the given cursor", async () => {
      respondWithReceipts([]);

      await read({ cursor: "resume" });

      expect(lastReceiptsUrl?.searchParams.get("next")).toBe("resume");
      expect(lastReceiptsUrl?.searchParams.get("limit")).toBe("100");
    });

    it("without a floor, stops at the page bound and reports the height it read down to", async () => {
      const pages = Array.from({ length: 12 }, (_, index) => [
        receipt({ transaction_hash: `x${index}`, block: { block_height: String(500 - index) } }),
      ]);
      const { cursors } = respondWithReceiptPages(pages);

      const { transfers, resumeCursor, truncatedAtHeight } = await read();

      expect(cursors).toHaveLength(10);
      expect(truncatedAtHeight).toBe(492);
      expect(resumeCursor).toBeUndefined();
      expect(transfers.map(t => t.blockHeight)).toEqual([
        500, 499, 498, 497, 496, 495, 494, 493, 492,
      ]);
    });

    it("at the page bound, drops the lowest block read, whose receipts may continue on the next page", async () => {
      const { cursors } = respondWithReceiptPages([
        [receipt({ transaction_hash: "above", block: { block_height: "300" } })],
        ...Array.from({ length: 9 }, (_, index) => [
          receipt({ transaction_hash: `same${index}`, block: { block_height: "200" } }),
        ]),
        [receipt({ transaction_hash: "unread", block: { block_height: "200" } })],
      ]);

      const { transfers, truncatedAtHeight } = await read();

      expect(cursors).toHaveLength(10);
      expect(truncatedAtHeight).toBe(201);
      expect(transfers.map(t => t.transactionHash)).toEqual(["above"]);
    });

    it("with a floor, reads past the page bound until the floor, so no payout of the window is lost", async () => {
      const pages = Array.from({ length: 12 }, (_, index) => [
        receipt({ transaction_hash: `x${index}`, block: { block_height: String(500 - index) } }),
      ]);
      const { cursors } = respondWithReceiptPages(pages);

      const { transfers, truncatedAtHeight } = await read({ floorHeight: 0 });

      expect(cursors).toHaveLength(12);
      expect(transfers).toHaveLength(12);
      expect(truncatedAtHeight).toBeUndefined();
    });

    it("stops at the first page that holds a stored transaction", async () => {
      const { cursors } = respondWithReceiptPages([
        [receipt({ transaction_hash: "new", block: { block_height: "300" } })],
        [receipt({ transaction_hash: "stored", block: { block_height: "200" } })],
        [receipt({ transaction_hash: "older", block: { block_height: "100" } })],
      ]);

      const { transfers } = await read({
        knownHashes: new Set(["stored"]),
        stopAtHashes: new Set(["stored"]),
      });

      expect(cursors).toEqual(["", "page-1"]);
      expect(transfers.map(t => t.transactionHash)).toEqual(["new"]);
    });

    it("with a floor, reads past a late receipt of a stored transaction down to the floor", async () => {
      const { cursors } = respondWithReceiptPages([
        [receipt({ transaction_hash: "stored", block: { block_height: "250" } })],
        [receipt({ transaction_hash: "unseen", block: { block_height: "220" } })],
        [receipt({ transaction_hash: "below", block: { block_height: "90" } })],
      ]);

      const { transfers } = await read({
        floorHeight: 100,
        knownHashes: new Set(["stored"]),
        stopAtHashes: new Set(["stored"]),
      });

      expect(cursors).toEqual(["", "page-1", "page-2"]);
      expect(transfers.map(t => t.transactionHash)).toEqual(["unseen"]);
    });

    it("with a floor and a page budget, stops at the budget and resumes from the page it stopped on", async () => {
      const pages = Array.from({ length: 12 }, (_, index) => [
        receipt({ transaction_hash: `x${index}`, block: { block_height: String(500 - index) } }),
      ]);
      const { cursors } = respondWithReceiptPages(pages);

      const { transfers, resumeCursor, truncatedAtHeight } = await read({
        floorHeight: 0,
        pageBudget: 10,
      });

      expect(cursors).toHaveLength(10);
      expect(truncatedAtHeight).toBe(492);
      expect(resumeCursor).toBe("page-9");
      expect(transfers.map(t => t.blockHeight)).toEqual([
        500, 499, 498, 497, 496, 495, 494, 493, 492,
      ]);
    });

    it("reads past the page budget when stopping would return nothing new", async () => {
      const pages = Array.from({ length: 12 }, (_, index) => [
        receipt({ transaction_hash: `x${index}`, block: { block_height: "400" } }),
      ]);
      const { cursors } = respondWithReceiptPages(pages);

      const { truncatedAtHeight } = await read({
        floorHeight: 0,
        upperHeight: 401,
        pageBudget: 10,
      });

      expect(cursors).toHaveLength(12);
      expect(truncatedAtHeight).toBeUndefined();
    });

    it("rejects when the indexer serves a cursor it already served", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/receipts`, () =>
          HttpResponse.json({ data: [receipt()], meta: { next_page: "same" } }),
        ),
      );

      await expect(read({ floorHeight: 0 })).rejects.toThrow("cursor does not advance");
    });

    it("looks up at most ten transaction trees at a time", async () => {
      respondWithReceipts(
        Array.from({ length: 25 }, (_, index) => receipt({ transaction_hash: `p${index}` })),
      );
      let inFlight = 0;
      let peak = 0;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/txns/:hash/receipts`, async () => {
          inFlight++;
          peak = Math.max(peak, inFlight);
          await new Promise(resolve => setTimeout(resolve, 5));
          inFlight--;
          return HttpResponse.json({
            data: {
              predecessor_account_id: INTENTS,
              receiver_account_id: INTENTS,
              actions: [],
              outcome: { status: true },
            },
          });
        }),
      );

      await read();
      expect(peak).toBe(10);
    });

    it("values a payout from its whole transaction, including a receipt outside the window", async () => {
      respondWithReceipts([receipt({ block: { block_height: "260" } })]);
      respondWithParties({}, undefined, {
        "payout-hash": [
          receiptNode(receipt({ receipt_id: "r-older", block: { block_height: "240" } })),
        ],
      });

      const { transfers } = await read({ floorHeight: 250 });

      expect(transfers).toHaveLength(1);
      expect(transfers[0].value).toBe("20000000000000000000000000");
      expect(transfers[0].blockHeight).toBe(260);
    });

    it("reports a payout only in the window that holds its newest receipt", async () => {
      respondWithReceipts([receipt({ block: { block_height: "240" } })]);
      respondWithParties({}, undefined, {
        "payout-hash": [
          receiptNode(receipt({ receipt_id: "r-newer", block: { block_height: "260" } })),
        ],
      });

      expect((await read({ upperHeight: 250 })).transfers).toEqual([]);
    });

    it("skips a payout while one of its transfers has no outcome yet", async () => {
      respondWithReceipts([receipt()]);
      respondWithParties({}, undefined, {
        "payout-hash": [
          { ...receiptNode(receipt({ receipt_id: "r-pending" })), outcome: {} as never },
        ],
      });

      expect((await read()).transfers).toEqual([]);
    });

    it("skips a payout while another of its receipts has no outcome yet, as it may still send one", async () => {
      respondWithReceipts([receipt()]);
      respondWithParties({}, undefined, {
        "payout-hash": [
          {
            predecessor_account_id: INTENTS,
            receiver_account_id: INTENTS,
            actions: [{ action: "FUNCTION_CALL", method: "ft_resolve_transfer" }],
            outcome: {} as never,
          },
        ],
      });

      expect((await read()).transfers).toEqual([]);
    });

    it("ignores gas refunds and failed transfers in the transaction's receipts", async () => {
      respondWithReceipts([receipt()]);
      respondWithParties({}, undefined, {
        "payout-hash": [
          receiptNode(receipt({ receipt_id: "refund", predecessor_account_id: "system" })),
          { ...receiptNode(receipt({ receipt_id: "failed" })), outcome: { status: false } },
        ],
      });

      expect((await read()).transfers[0].value).toBe(PAYOUT);
    });

    it("rejects when a lookup fails", async () => {
      respondWithReceipts([receipt()]);
      respondWithParties({ "payout-hash": null });

      await expect(read()).rejects.toThrow("no receipts indexed");
    });
  });

  describe("fetchLegacyHistory", () => {
    const stakingTxn = (overrides: Partial<NearTransaction> = {}): NearTransaction =>
      txn({
        transaction_hash: "stake-hash",
        receiver_account_id: "pool.poolv1.near",
        actions: [{ action: "FUNCTION_CALL", method: "deposit_and_stake" }],
        ...overrides,
      });

    it("maps a staking call to the pool it was sent to", async () => {
      respondWith([stakingTxn()]);

      const { stakingPoolsCalled } = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(stakingPoolsCalled).toEqual(new Map([["stake-hash", "pool.poolv1.near"]]));
    });

    it("detects a staking method in a later action", async () => {
      respondWith([
        stakingTxn({
          actions: [
            { action: "TRANSFER", method: null },
            { action: "FUNCTION_CALL", method: "unstake_all" },
          ],
        }),
      ]);

      const { stakingPoolsCalled, operations } = await fetchLegacyHistory(
        mockNearConfig,
        ACCOUNT_ID,
        ADDRESS,
      );

      expect(stakingPoolsCalled.get("stake-hash")).toBe("pool.poolv1.near");
      expect(operations[0].type).toBe("OUT");
    });

    it("ignores a staking call signed by another account", async () => {
      respondWith([stakingTxn({ signer_account_id: "someone-else.near" })]);

      const { stakingPoolsCalled } = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(stakingPoolsCalled.size).toBe(0);
    });

    it("ignores a function call that is not a staking-pool method", async () => {
      respondWith([stakingTxn({ actions: [{ action: "FUNCTION_CALL", method: "ft_transfer" }] })]);

      const { stakingPoolsCalled } = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(stakingPoolsCalled.size).toBe(0);
    });

    it("ignores a transaction without actions", async () => {
      const { actions: _actions, ...withoutActions } = stakingTxn();
      respondWith([withoutActions]);

      const { stakingPoolsCalled } = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(stakingPoolsCalled.size).toBe(0);
    });

    it.each([
      [24, false],
      [25, true],
    ])("reports a page of %i transactions as full: %s", async (count, isFullPage) => {
      respondWith(
        Array.from({ length: count }, (_, index) => txn({ transaction_hash: `hash-${index}` })),
      );

      const history = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

      expect(history.isFullPage).toBe(isFullPage);
      expect(history.operations).toHaveLength(count);
    });

    describe("incoming transfers delivered by receipt", () => {
      it("adds a payout the transactions listing lacks, and nothing for what it lists or refunds", async () => {
        respondWith([
          txn({
            transaction_hash: "direct",
            signer_account_id: "peer.near",
            receiver_account_id: ADDRESS,
          }),
        ]);
        respondWithReceipts([
          receipt({ transaction_hash: "payout-hash" }),
          receipt({ transaction_hash: "refund-hash", predecessor_account_id: "system" }),
          receipt({ transaction_hash: "direct", predecessor_account_id: "peer.near" }),
        ]);

        const { operations } = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

        expect(operations).toHaveLength(2);
        const payout = operations.find(operation => operation.hash === "payout-hash");
        expect(payout).toMatchObject({
          type: "IN",
          value: new BigNumber(PAYOUT),
          fee: new BigNumber(0),
          senders: [INTENTS],
          recipients: [ADDRESS],
          blockHeight: 159618980,
          blockHash: "ReceiptBlockHash",
          hasFailed: false,
        });
        expect(payout?.date).toEqual(new Date(1755192310610.7415));
        expect(partiesLookups).toEqual(["payout-hash"]);
      });

      it("makes no transaction lookup when every receipt is already known", async () => {
        respondWith([txn({ transaction_hash: "newer" }), txn({ transaction_hash: "stored" })]);
        respondWithReceipts([receipt({ transaction_hash: "stored" })]);

        const { operations } = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["stored"]),
        );

        expect(operations).toHaveLength(2);
        expect(partiesLookups).toEqual([]);
      });

      it("reads receipts only down to the oldest transaction read once a known one was reached", async () => {
        respondWith([
          txn({ transaction_hash: "newer", block: { block_height: "300" } }),
          txn({ transaction_hash: "stored", block: { block_height: "200" } }),
        ]);
        respondWithReceipts([
          receipt({ transaction_hash: "in-window", block: { block_height: "250" } }),
          receipt({ transaction_hash: "older", block: { block_height: "100" } }),
        ]);

        const { operations } = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["stored"]),
        );

        expect(operations.map(operation => operation.hash).sort()).toEqual([
          "in-window",
          "newer",
          "stored",
        ]);
      });

      it("reads receipts to the end of the list when the transactions ended without a known one", async () => {
        respondWith([txn({ transaction_hash: "only", block: { block_height: "300" } })]);
        respondWithReceipts([
          receipt({ transaction_hash: "old-payout", block: { block_height: "100" } }),
        ]);

        const { operations } = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

        expect(operations.map(operation => operation.hash).sort()).toEqual(["old-payout", "only"]);
      });

      it("keeps a contiguous newest window when the receipts read stops at its bound", async () => {
        respondWith([
          txn({ transaction_hash: "recent", block: { block_height: "495" } }),
          txn({ transaction_hash: "old", block: { block_height: "100" } }),
        ]);
        respondWithReceiptPages(
          Array.from({ length: 12 }, (_, index) => [
            receipt({
              transaction_hash: `p${index}`,
              block: { block_height: String(500 - index) },
            }),
          ]),
        );

        const { operations, isFullPage } = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
        );

        expect(operations.map(operation => operation.hash)).not.toContain("old");
        expect(operations.map(operation => operation.hash)).toContain("recent");
        expect(operations.every(operation => (operation.blockHeight ?? 0) >= 491)).toBe(true);
        expect(isFullPage).toBe(true);
      });

      it.each([
        ["a stored history it did not reach", new Set(["stored-payout"]), true],
        ["nothing stored", new Set<string>(), false],
      ])(
        "reports a gap when the receipts read stops at its bound with %s",
        async (_, knownHashes, gap) => {
          respondWith([txn({ transaction_hash: "recent", block: { block_height: "495" } })]);
          respondWithReceiptPages(
            Array.from({ length: 12 }, (_, index) => [
              receipt({
                transaction_hash: `p${index}`,
                block: { block_height: String(500 - index) },
              }),
            ]),
          );

          const history = await fetchLegacyHistory(
            mockNearConfig,
            ACCOUNT_ID,
            ADDRESS,
            knownHashes,
          );

          expect(history.gap).toBe(gap);
        },
      );
    });

    describe("paging", () => {
      const fullPage = (prefix: string) =>
        Array.from({ length: 25 }, (_, index) => txn({ transaction_hash: `${prefix}-${index}` }));

      // Serves the given pages in order, each with the cursor of the next, and counts the requests.
      const respondWithPages = (pages: NearTransaction[][]): { requests: () => string[] } => {
        const cursors: string[] = [];
        mockServer.use(
          http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, ({ request }) => {
            const cursor = new URL(request.url).searchParams.get("next") ?? "";
            cursors.push(cursor);
            const index = cursor === "" ? 0 : Number(cursor.replace("page-", ""));
            return HttpResponse.json({
              data: pages[index],
              ...(index + 1 < pages.length && { meta: { next_page: `page-${index + 1}` } }),
            });
          }),
        );
        return { requests: () => cursors };
      };

      it("reads past the first page until a transaction it knows, so a burst is not lost", async () => {
        const { requests } = respondWithPages([
          fullPage("a"),
          fullPage("b"),
          [txn({ transaction_hash: "known" }), txn({ transaction_hash: "older" })],
        ]);

        const history = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["known"]),
        );

        expect(requests()).toEqual(["", "page-1", "page-2"]);
        expect(history.operations).toHaveLength(52);
        expect(history.isFullPage).toBe(false);
      });

      it("stops at the page that holds a known transaction", async () => {
        const { requests } = respondWithPages([
          [...fullPage("a").slice(0, 24), txn({ transaction_hash: "known" })],
          fullPage("b"),
        ]);

        await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS, new Set(["known"]));

        expect(requests()).toEqual([""]);
      });

      it("reads past a known transaction until the unsettled ones were read, keeping the stored history", async () => {
        const { requests } = respondWithPages([
          [...fullPage("a").slice(0, 24), txn({ transaction_hash: "known" })],
          [...fullPage("b").slice(0, 24), txn({ transaction_hash: "unsettled" })],
          fullPage("c"),
        ]);

        const history = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["known", "unsettled"]),
          new Set(["unsettled"]),
        );

        expect(requests()).toEqual(["", "page-1"]);
        expect(history.operations).toHaveLength(50);
        expect(history.gap).toBe(false);
      });

      it("reads past newly stored transactions until the boundary hash", async () => {
        const { requests } = respondWithPages([
          [...fullPage("a").slice(0, 24), txn({ transaction_hash: "stored-new" })],
          [
            ...fullPage("b").slice(0, 23),
            txn({ transaction_hash: "late" }),
            txn({ transaction_hash: "boundary" }),
          ],
          fullPage("c"),
        ]);

        const history = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["stored-new", "boundary"]),
          new Set(["boundary"]),
        );

        expect(requests()).toEqual(["", "page-1"]);
        expect(history.operations.map(({ hash }) => hash)).toContain("late");
        expect(history.gap).toBe(false);
      });

      it("is bounded when an unsettled transaction is never found, and still joins the stored history", async () => {
        const pages = [
          [...fullPage("a").slice(0, 24), txn({ transaction_hash: "known" })],
          ...Array.from({ length: 11 }, (_, index) => fullPage(`p${index}`)),
        ];
        const { requests } = respondWithPages(pages);

        const history = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["known", "gone"]),
          new Set(["gone"]),
        );

        expect(requests()).toHaveLength(10);
        expect(history.gap).toBe(false);
      });

      it("reads the newest page only when nothing is known yet", async () => {
        const { requests } = respondWithPages([fullPage("a"), fullPage("b")]);

        const history = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

        expect(requests()).toEqual([""]);
        expect(history.isFullPage).toBe(true);
      });

      it("is bounded, and says older transactions may remain", async () => {
        const pages = Array.from({ length: 12 }, (_, index) => fullPage(`p${index}`));
        const { requests } = respondWithPages(pages);

        const history = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["never-seen"]),
        );

        expect(requests()).toHaveLength(10);
        expect(history.isFullPage).toBe(true);
        expect(history.gap).toBe(true);
      });

      it("stops when the indexer has no further page", async () => {
        const { requests } = respondWithPages([fullPage("a")]);

        const history = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
          new Set(["never-seen"]),
        );

        expect(requests()).toEqual([""]);
        expect(history.isFullPage).toBe(false);
      });
    });

    describe("what the sync reads again", () => {
      it("lists the transactions whose outcome is not indexed yet", async () => {
        respondWith([
          txn({ transaction_hash: "settled" }),
          txn({ transaction_hash: "pending", outcomes: {} }),
        ]);

        const { outcomePendingHashes } = await fetchLegacyHistory(
          mockNearConfig,
          ACCOUNT_ID,
          ADDRESS,
        );

        expect(outcomePendingHashes).toEqual(["pending"]);
      });

      it("lists the staking calls another account relayed for this one", async () => {
        respondWith([
          txn({
            transaction_hash: "relayed",
            signer_account_id: "relayer.near",
            receiver_account_id: ADDRESS,
            actions: [
              { action: "DELEGATE_ACTION", method: null },
              { action: "FUNCTION_CALL", method: "deposit_and_stake" },
            ],
          }),
          txn({
            transaction_hash: "relayed-claim",
            signer_account_id: "relayer.near",
            receiver_account_id: ADDRESS,
            actions: [
              { action: "DELEGATE_ACTION", method: null },
              { action: "FUNCTION_CALL", method: "claim" },
            ],
          }),
          txn({
            transaction_hash: "own",
            actions: [
              { action: "DELEGATE_ACTION", method: null },
              { action: "FUNCTION_CALL", method: "deposit_and_stake" },
            ],
          }),
          txn({ transaction_hash: "received", signer_account_id: "someone.near" }),
        ]);

        const { relayedHashes } = await fetchLegacyHistory(mockNearConfig, ACCOUNT_ID, ADDRESS);

        expect(relayedHashes).toEqual(["relayed"]);
      });
    });
  });
});
