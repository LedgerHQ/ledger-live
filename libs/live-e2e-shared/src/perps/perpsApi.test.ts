import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import { PerpsApi } from "./perpsApi";

const ADDRESS = "0x30Fb429E206729962c548b9a8d7E79095cC7E0E2";
const XYZ_MARKET = "hyperliquid-xyz-xyz:gold-usdc";
const BTC_MARKET = "hyperliquid-btc-usdc";
const FAST_POLLING = { intervalMs: 0, attempts: 2 };

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Route = (url: string, init?: RequestInit) => unknown;

/** Answers each request from `route`; `/providers` lists both providers. */
function mockApi(route: Route) {
  return mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url.endsWith("/providers")) {
      return jsonResponse([{ id: "hyperliquid" }, { id: "hyperliquid-xyz" }]);
    }
    return jsonResponse(route(url, init));
  });
}

const providerOfBody = (init?: RequestInit): string => JSON.parse(String(init?.body)).providerId;

afterEach(() => mock.restoreAll());

test("getProviderIds lists the providers the live app lists", async () => {
  mockApi(() => []);
  assert.deepEqual(await new PerpsApi("https://api.test").getProviderIds(), [
    "hyperliquid",
    "hyperliquid-xyz",
  ]);
});

test("getOrders reads every provider and takes the offered cancel arguments", async () => {
  mockApi((_url, init) =>
    providerOfBody(init) === "hyperliquid-xyz"
      ? [
          {
            marketId: XYZ_MARKET,
            pendingActions: [{ type: "cancelOrder", args: { orderId: "7" } }],
          },
        ]
      : [],
  );

  assert.deepEqual(await new PerpsApi("https://api.test").getOrders(ADDRESS), [
    { providerId: "hyperliquid-xyz", marketId: XYZ_MARKET, cancelArgs: { orderId: "7" } },
  ]);
});

test("getOrders fails on an in-scope order the API offers no cancel for", async () => {
  mockApi(() => [{ marketId: BTC_MARKET, pendingActions: [] }]);
  await assert.rejects(
    new PerpsApi("https://api.test").getOrders(ADDRESS, [BTC_MARKET]),
    /cannot be cancelled/,
  );
});

test("getOrders ignores an unrelated order that cannot be cancelled", async () => {
  mockApi((_url, init) =>
    providerOfBody(init) === "hyperliquid"
      ? [{ marketId: BTC_MARKET, pendingActions: [] }]
      : [
          {
            marketId: XYZ_MARKET,
            pendingActions: [{ type: "cancelOrder", args: { orderId: "1" } }],
          },
        ],
  );

  const orders = await new PerpsApi("https://api.test").getOrders(ADDRESS, [XYZ_MARKET]);

  assert.deepEqual(
    orders.map(({ marketId }) => marketId),
    [XYZ_MARKET],
  );
});

test("getPositions ignores a malformed position on another market", async () => {
  mockApi((_url, init) =>
    providerOfBody(init) === "hyperliquid"
      ? [{ marketId: BTC_MARKET }]
      : [{ marketId: XYZ_MARKET, side: "long", size: "1" }],
  );

  assert.deepEqual(await new PerpsApi("https://api.test").getPositions(ADDRESS, [XYZ_MARKET]), [
    { providerId: "hyperliquid-xyz", marketId: XYZ_MARKET, side: "long", size: "1" },
  ]);
});

test("getMarketSymbol reads the base asset symbol", async () => {
  mockApi(url =>
    url.endsWith(`/markets/${encodeURIComponent(XYZ_MARKET)}`)
      ? { baseAsset: { symbol: "xyz:GOLD" } }
      : {},
  );
  assert.equal(await new PerpsApi("https://api.test").getMarketSymbol(XYZ_MARKET), "xyz:GOLD");
});

test("PerpsApi reports the status and body of a failed request", async () => {
  mock.method(globalThis, "fetch", async () => new Response("bad marketId", { status: 400 }));
  await assert.rejects(
    new PerpsApi("https://api.test").createAction({
      providerId: "hyperliquid",
      address: ADDRESS,
      action: "close",
      args: {},
    }),
    /\/actions failed: 400 bad marketId/,
  );
});

test("PerpsApi gives every request a timeout signal", async () => {
  const fetchMock = mockApi(() => []);
  await new PerpsApi("https://api.test").getProviderIds();
  assert.ok(fetchMock.mock.calls[0].arguments[1]?.signal instanceof AbortSignal);
});

test("waitForAction resolves once the action succeeds", async () => {
  const statuses = ["PROCESSING", "SUCCESS"];
  mockApi(() => ({ status: statuses.shift() }));
  await new PerpsApi("https://api.test", FAST_POLLING).waitForAction("a1");
  assert.equal(statuses.length, 0);
});

test("waitForAction stops on a failed action", async () => {
  mockApi(() => ({ status: "FAILED" }));
  await assert.rejects(
    new PerpsApi("https://api.test", FAST_POLLING).waitForAction("a1"),
    /ended as FAILED/,
  );
});

test("waitForAction gives up after the last attempt", async () => {
  mockApi(() => ({ status: "PROCESSING" }));
  await assert.rejects(
    new PerpsApi("https://api.test", FAST_POLLING).waitForAction("a1"),
    /did not succeed in time/,
  );
});
