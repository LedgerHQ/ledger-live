import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { listOperations } from "./listOperations";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const NODE_INFO = `${TEST_COSMOS_ENDPOINT}/cosmos/base/tendermint/v1beta1/node_info`;
const TXS = `${TEST_COSMOS_ENDPOINT}/cosmos/tx/v1beta1/txs`;

// `CosmosAPI.getTransactionsPage` first resolves the chain's cosmos-sdk version (to pick modern
// vs legacy query params) via a single, memoized node_info call shared by both the
// message.sender and transfer.recipient tx-stream fetches — so every test here must stub it too,
// even though listOperations itself never reads it directly.
const NODE_INFO_RESPONSE = { application_version: { cosmos_sdk_version: "0.50.6" } };

const sendTx = (overrides: Partial<{ txhash: string; height: string }> = {}) => ({
  txhash: overrides.txhash ?? "TXHASH1",
  height: overrides.height ?? "1000",
  timestamp: "2024-06-01T12:00:00Z",
  code: 0,
  events: [],
  tx: {
    body: {
      messages: [
        {
          "@type": "/cosmos.bank.v1beta1.MsgSend",
          from_address: ADDR,
          to_address: "cosmos1recipient00000000000000000000000000",
          amount: [{ denom: "uatom", amount: "2000000" }],
        },
      ],
      memo: "test transfer",
    },
    auth_info: {
      fee: { amount: [{ denom: "uatom", amount: "5000" }] },
      signer_infos: [{ sequence: "7" }],
    },
  },
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("listOperations via MSW", () => {
  it("returns a page of parsed operations for a native send", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(NODE_INFO, () => HttpResponse.json(NODE_INFO_RESPONSE)),
      // Same body serves both the sender and recipient stream requests; listOperations dedupes
      // by tx hash, so this still exercises the merge/dedupe path (1 unique tx from 2 streams).
      http.get(TXS, () => HttpResponse.json({ tx_responses: [sendTx()], total: 1 })),
    );

    const page = await listOperations(api, ADDR, "cosmos", { minHeight: 0 });

    expect(page.items).toHaveLength(1);
    const op = page.items[0];
    expect(op.type).toBe("OUT");
    expect(op.value).toBe(2_005_000n); // amount (2_000_000) + fee (5_000), sender pays fees
    expect(op.senders).toEqual([ADDR]);
    expect(op.recipients).toEqual(["cosmos1recipient00000000000000000000000000"]);
    expect(op.asset).toEqual({ type: "native" });
    expect(op.details).toEqual({ memo: "test transfer" });
    expect(op.tx.hash).toBe("TXHASH1");
    expect(op.tx.block.height).toBe(1000);
    expect(op.tx.fees).toBe(5000n);
    expect(op.tx.failed).toBe(false);
    expect(page.next).toBeUndefined();
  });

  it("returns an empty page (no next cursor) when the address has no transaction history", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(NODE_INFO, () => HttpResponse.json(NODE_INFO_RESPONSE)),
      http.get(TXS, () => HttpResponse.json({ tx_responses: [], total: 0 })),
    );

    const page = await listOperations(api, ADDR, "cosmos", { minHeight: 0 });

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  // `CosmosAPI`'s private `fetchTransactionsPage` wraps the node_info lookup + txs fetch in a
  // try/catch that swallows any failure and returns `{ txs: [], total: 0 }` for that stream — so a
  // 500 here does NOT propagate out of listOperations; it degrades to the same empty page as "no
  // history", independently for each stream.
  it("degrades to an empty page (does not throw) when the txs endpoint errors", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(NODE_INFO, () => HttpResponse.json(NODE_INFO_RESPONSE)),
      http.get(TXS, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(listOperations(api, ADDR, "cosmos", { minHeight: 0 })).resolves.toEqual({
      items: [],
      next: undefined,
    });
  });
});
