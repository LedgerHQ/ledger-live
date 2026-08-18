import { http, HttpResponse } from "msw";
import { TEST_KASPA_ENDPOINT, server } from "../../test/msw.mock";
import { listOperations } from "./listOperations";

const ADDRESS = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";
// getTransactions builds `/addresses/{encoded-address}/full-transactions-page?...`; the query
// string doesn't affect MSW path matching.
const TX_URL = `${TEST_KASPA_ENDPOINT}/addresses/:address/full-transactions-page`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("listOperations via MSW", () => {
  it("maps an OUT transaction and propagates the X-Next-Page-After cursor", async () => {
    server.use(
      http.get(TX_URL, () =>
        HttpResponse.json(
          [
            {
              transaction_id: "tx-out",
              hash: "tx-out",
              block_hash: ["block-hash"],
              block_time: 1700000000000,
              accepting_block_blue_score: 100,
              inputs: [{ previous_outpoint_address: ADDRESS, previous_outpoint_amount: 1_000_000 }],
              outputs: [
                {
                  script_public_key_address:
                    "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65",
                  amount: 700_000,
                },
                { script_public_key_address: ADDRESS, amount: 250_000 },
              ],
            },
          ],
          { headers: { "X-Next-Page-After": "12345" } },
        ),
      ),
    );

    const page = await listOperations(ADDRESS, { minHeight: 0 });

    expect(page.next).toBe("12345");
    expect(page.items).toHaveLength(1);
    const [op] = page.items;
    expect(op.type).toBe("OUT");
    // fee = totalInput(1_000_000) - totalOutput(950_000) = 50_000; amount sent = 700_000.
    // Framework Operation.value is the pure amount — the generic adapter re-adds fees for OUT.
    expect(op.tx.fees).toBe(50_000n);
    expect(op.value).toBe(700_000n);
    expect(op.asset).toEqual({ type: "native", name: "KAS" });
  });

  it("returns an undefined cursor and no items when the indexer has no data", async () => {
    server.use(http.get(TX_URL, () => HttpResponse.json([])));

    const page = await listOperations(ADDRESS, { minHeight: 0 });

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });
});
