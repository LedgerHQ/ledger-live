import { mockNearContext } from "../../test/context";
import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../../network/node.mock";
import type { NearTransaction } from "../../network/sdk.types";
import { listOperations } from "../listOperations";

const ADDRESS = "sender.near";

const transaction = (overrides: Partial<NearTransaction> = {}): NearTransaction => ({
  signer_account_id: ADDRESS,
  receiver_account_id: "recipient.near",
  transaction_hash: "hash-1",
  block_timestamp: "1750000000000000000",
  block: { block_height: "140000000" },
  actions_agg: { deposit: "1000000000000000000000000" },
  outcomes_agg: { transaction_fee: "100000000000000000000" },
  outcomes: { status: true },
  ...overrides,
});

describe("listOperations (MSW)", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() =>
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/receipts`, () =>
        HttpResponse.json({ data: [] }),
      ),
    ),
  );
  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("maps a transaction into an Operation", async () => {
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, () =>
        HttpResponse.json({ data: [transaction()] }),
      ),
    );

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: "hash-1",
      type: "OUT",
      value: 1_000_000_000_000_000_000_000_000n,
    });
  });

  it("wraps the indexer's opaque cursor in its own token and unwraps it on the next page", async () => {
    const indexerCursor = "eyJhY2NvdW50X2lkIjoid2Fja2F6b25nLnBvb2x2MS5uZWFyIn0=";
    const requestedNext: (string | null)[] = [];

    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, ({ request }) => {
        requestedNext.push(new URL(request.url).searchParams.get("next"));
        return HttpResponse.json({
          data: [transaction()],
          meta: { next_page: indexerCursor },
        });
      }),
    );

    const first = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });
    await listOperations(mockNearContext, ADDRESS, { cursor: first.next, minHeight: 0 });

    expect(JSON.parse(Buffer.from(first.next ?? "", "base64url").toString("utf8"))).toMatchObject({
      t: indexerCursor,
    });
    expect(requestedNext).toEqual([null, indexerCursor]);
  });

  it("returns an empty page rather than undefined items when the indexer has no data", async () => {
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, () =>
        HttpResponse.json({ data: null }),
      ),
    );

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  it("drops transactions below minHeight and stops advertising a next cursor once the floor is reached", async () => {
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, () =>
        HttpResponse.json({
          data: [
            transaction({ transaction_hash: "above", block: { block_height: "200" } }),
            transaction({ transaction_hash: "below", block: { block_height: "50" } }),
          ],
          meta: { next_page: "would-be-next" },
        }),
      ),
    );

    const page = await listOperations(mockNearContext, ADDRESS, { minHeight: 100 });

    expect(page.items.map(o => o.id)).toEqual(["above"]);
    expect(page.next).toBeUndefined();
  });

  it("clamps an out-of-range limit instead of forwarding it to the indexer", async () => {
    let requestedLimit: string | null = null;
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, ({ request }) => {
        requestedLimit = new URL(request.url).searchParams.get("limit");
        return HttpResponse.json({ data: [] });
      }),
    );

    await listOperations(mockNearContext, ADDRESS, { limit: 500, minHeight: 0 });

    expect(requestedLimit).toBe("100");
  });

  it("rejects ascending order without issuing a request", async () => {
    // No handler registered: a request would fail the suite via onUnhandledRequest.
    await expect(
      listOperations(mockNearContext, ADDRESS, { order: "asc", minHeight: 0 }),
    ).rejects.toThrow("ascending order is not supported");
  });

  it("spreads a long receipt history over bounded calls, whole and newest first", async () => {
    const payoutHeights = Array.from({ length: 15 }, (_, index) => 1000 - index * 10);
    const receiptRequests: string[] = [];
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, () =>
        HttpResponse.json({
          data: [
            transaction({ transaction_hash: "newest", block: { block_height: "1100" } }),
            transaction({ transaction_hash: "oldest", block: { block_height: "500" } }),
          ],
        }),
      ),
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/receipts`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("next") ?? "page-0";
        receiptRequests.push(cursor);
        const index = Number(cursor.replace("page-", ""));
        const height = String(payoutHeights[index]);
        return HttpResponse.json({
          data: [
            {
              receipt_id: `r${index}`,
              transaction_hash: `payout-${height}`,
              predecessor_account_id: "intents.near",
              receiver_account_id: ADDRESS,
              actions: [{ action: "TRANSFER", method: null }],
              actions_agg: { deposit: "1" },
              outcome: { status: true },
              block: { block_height: height, block_hash: `b${height}`, block_timestamp: "0" },
            },
          ],
          ...(index + 1 < payoutHeights.length && { meta: { next_page: `page-${index + 1}` } }),
        });
      }),
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/txns/:hash/receipts`, ({ params }) => {
        const height = String(params.hash).replace("payout-", "");
        return HttpResponse.json({
          data: {
            predecessor_account_id: "intents.near",
            receiver_account_id: "intents.near",
            actions: [],
            outcome: { status: true },
            receipts: [
              {
                predecessor_account_id: "intents.near",
                receiver_account_id: ADDRESS,
                actions: [{ action: "TRANSFER", args: { deposit: "1" } }],
                outcome: { status: true },
                block: { block_height: height, block_hash: `b${height}`, block_timestamp: "0" },
              },
            ],
          },
        });
      }),
    );

    const first = await listOperations(mockNearContext, ADDRESS, { minHeight: 0 });
    const requestsOfFirstCall = receiptRequests.length;
    const second = await listOperations(mockNearContext, ADDRESS, {
      minHeight: 0,
      cursor: first.next,
    });

    expect(requestsOfFirstCall).toBe(10);
    expect(second.next).toBeUndefined();
    expect([...first.items, ...second.items].map(item => item.tx.block.height)).toEqual([
      1100,
      ...payoutHeights,
      500,
    ]);
  });
});
