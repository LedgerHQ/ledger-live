import { http, HttpResponse } from "msw";
import { setCoinConfig } from "../config";
import { fetchLegacyHistory, fetchTransactionsPage, getOperations } from "./indexer";
import { mockNearConfig } from "../test/context";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";
import { NearTransaction } from "./sdk.types";

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

  afterEach(() => {
    mockServer.resetHandlers();
    lastRequestUrl = undefined;
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
