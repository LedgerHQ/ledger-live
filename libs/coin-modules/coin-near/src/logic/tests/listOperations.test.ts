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

  it("forwards the indexer's opaque cursor unchanged on the next page", async () => {
    const cursor = "eyJhY2NvdW50X2lkIjoid2Fja2F6b25nLnBvb2x2MS5uZWFyIn0=";
    let requestedNext: string | null = null;

    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/accounts/:address/txns`, ({ request }) => {
        requestedNext = new URL(request.url).searchParams.get("next");
        return HttpResponse.json({ data: [transaction()], meta: { next_page: cursor } });
      }),
    );

    const page = await listOperations(mockNearContext, ADDRESS, { cursor, minHeight: 0 });

    expect(requestedNext).toBe(cursor);
    expect(page.next).toBe(cursor);
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
});
